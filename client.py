# -*- encoding: utf-8 -*-

import os
import socket
import sys
import select

from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_PSS
from Crypto.Hash import SHA

from communication import send, receive
import threading

from flask import Flask, jsonify , request
from flask_cors import CORS

from server import getApp
import json
import os

from datetime import datetime

app = None

def check_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3)
    result = sock.connect_ex(('127.0.0.1', port))
    if not result == 0:
        sock.close()
        return True
    else:
        sock.close()
        return False
    

def putMessage(name,dataMsg,state,sender):
    path="./messages/"+name+'.json'
    if not os.path.exists(path):
        # Create the file and write an empty dictionary
        dir_name = os.path.dirname(path)
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
        with open(path, 'w') as f:
            json.dump({}, f)
    with open(path, 'r') as f:
        data = json.load(f)
    hacked=""
    if dataMsg[-2:]=="no":
        hacked="yes"
    new_message = {"state":state,"message":str(dataMsg[:-2]),"sender":sender,"hacked":hacked}
    data[datetime.now().strftime("%d-%m-%y %H:%M:%S:%f")]=new_message
    with open(path, 'w') as f:
        json.dump(data, f)



class ChatClient(object):

    def __init__(self, name, host='127.0.0.1', port=3490,hack=False):
        self.name = name
        # Quit flag
        self.flag = False
        self.port = int(port)
        self.host = host

        self.hack=hack
        # Initial prompt
        # self.prompt = '[' + '@'.join((name, socket.gethostname().split('.')[0])) + ']> '
        self.prompt=""
        self.flaskPort=""
        client_privkey = RSA.generate(4096, os.urandom)
        client_pubkey = client_privkey.publickey()

        self.decryptor = client_privkey
        self.getMessageJS()
        new_thread = threading.Thread(target=self.runFlask)
        new_thread.start()
        
        # Connect to server at port
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((host, self.port))
            print('Connected to chat server %s:%d' % (self.host, self.port))
            # Send my pubkey...
            send(self.sock, client_pubkey.exportKey())
            server_pubkey = receive(self.sock)

            self.encryptor = RSA.importKey(server_pubkey)

            # Send my name...
            send(self.sock, 'NAME: ' + self.name+' PORT: '+str(self.flaskPort))
            data = receive(self.sock)

            # Contains client address, set it
            addr = data.split('CLIENT: ')[1]
            # self.prompt = '[' + '@'.join((self.name, addr)) + ']> '
            self.prompt=""
            

        except socket.error:
            print('Could not connect to chat server @%d' % self.port)
            sys.exit(1)

    def getMessageJS(self):
        self.flaskPort=-1
        for i in range(5000,10000):
            if check_port(i):
                self.flaskPort=i
                break;
        global app
        # os.system("fuser -k 5001/tcp")
        app = Flask(__name__)
        CORS(app)
        @app.route("/send/<string:reciever>", methods=["POST"])
        def getJS(reciever):
            data = request.get_json()
            self.sendToServer(data,reciever)
            return  jsonify("success")
    def runFlask(self):
        global app
        app.run(port=self.flaskPort)
    
    def sendToServer(self,data,reciever):
        try:
            #encode
            data = data.encode()
            # encrypt
            data = self.encryptor.encrypt(data, 0)
            data = data[0]
            data_to_sign=data
            
            # not the same msg
            if self.hack==True:
                data_to_sign=data_to_sign+data_to_sign
            # append signature
            signkey = self.decryptor
            message_hash = SHA.new()
            message_hash.update(data_to_sign)

            signer = PKCS1_PSS.new(signkey)
            signature = signer.sign(message_hash)
            data = '%s#^[[%s#^[[%s' % (data, signature,reciever)

        except ValueError:
            print('Too large text, cannot encrypt, not sending.')
            data = None
        if data:
            send(self.sock, data)
                            
    def cmdloop(self):
        while not self.flag:
            try:
                sys.stdout.write(self.prompt)
                sys.stdout.flush()

                # Wait for input from stdin & socket
                inputready, outputready, exceptrdy = select.select([0, self.sock], [], [])

                for i in inputready:
                    if i == 0:
                        # grab message
                        data = sys.stdin.readline().strip()
                        self.sendToServer(data,"")

                    elif i == self.sock:
                        data = receive(self.sock)

                        if not data:
                            print( 'Shutting down.')
                            self.flag = True
                            break

                        else:
                            if 'PLAIN:' in data:
                                data = data.strip('PLAIN:').strip()
                            else:
                                data = self.decryptor.decrypt(data)
                                
                            

                            sys.stdout.write(data.decode() + '\n')
                            sys.stdout.flush()
                            
                            
                            if "]>> " in data.decode():
                                
                                putMessage(self.name,data.decode().split("]>> ")[1],"recieved",data.decode().split("[")[1].split("@")[0])
                        

            except KeyboardInterrupt:
                print( 'Interrupted.')
                self.sock.close()
                break
    
    

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit('Usage: %s username host portno' % sys.argv[0])
    elif len(sys.argv) == 4:
        client = ChatClient(sys.argv[1], sys.argv[2], int(sys.argv[3]))
        client.cmdloop()
    elif len(sys.argv) >4:
        client = ChatClient(sys.argv[1], sys.argv[2], int(sys.argv[3]),True)
        client.cmdloop()
    

    