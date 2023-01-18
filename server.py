# -*- encoding: utf-8 -*-

import os
import select
import socket
import signal
from time import sleep
import ast
import sys

from datetime import datetime

from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_PSS
from Crypto.Hash import SHA

from communication import send, receive
import data.constants 
import threading

from flask import Flask, jsonify,request
from flask_cors import CORS

import ldap_auth.authentification as authentication

import os
import json

from models.user import User


app=None

def getApp():
    return app

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

class ChatServer(object):
    
    
    def __init__(self, address='127.0.0.1', port=3490):
        self.clients = 0
        self.serverPort=port
        self.serverAddress=address
        # Client map
        self.clientmap = {}
        
        

        # Output socket list
        self.outputs = []

        os.system("fuser -k "+ port+"/tcp")
        
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((address, int(port)))

        print('Generating RSA keys ...')
        self.server_privkey = RSA.generate(4096, os.urandom)
        self.server_pubkey = self.server_privkey.publickey()

        print('Listening to port', port, '...')
        self.server.listen(5)

        # Trap keyboard interrupts
        signal.signal(signal.SIGINT, self.sighandler)
        new_thread = threading.Thread(target=self.printClient)
        new_thread.start()

    def printClient(self):
        
        os.system("fuser -k 5000/tcp")
        
        global app
        app = Flask(__name__)
        CORS(app)
        @app.route("/connected", methods=["GET"])
        def get_users():
            connected_users=[]
            for user in self.clientmap:
                connected_users.append(self.get_just_name(user))
            return jsonify(connected_users)
        @app.route("/users", methods=["GET"])
        def get_connected():
            return jsonify(authentication.get_ldap_users())
        @app.route("/messages/<string:user>", methods=["GET"])
        def get_messages(user):
            path="./messages/"+user+'.json'
            if not os.path.exists(path):
                return jsonify("")
            with open(path, 'r') as f:
                data = json.load(f)
            return jsonify(data)
        @app.route("/port/<string:user>", methods=["GET"])
        def getPort(user):
            p=-1
            for x in self.clientmap:
                
                x=self.clientmap[x]
                if x[1]==user:
                    p=x[3]
            return jsonify(p)
        @app.route("/login/<string:user_name>/<string:password>", methods=["GET"])
        def login(user_name,password):
            
            result=authentication.sign_in(user_name,password)
            if result=={}:
                return jsonify({})
            return jsonify({"user_name":str(result["user"].user_name),"first_name":str(result["user"].first_name),
                            "last_name":str(result["user"].last_name),"mail":str(result["user"].mail)})
        
        @app.route("/register/<string:first_name>/<string:last_name>/<string:mail>/<string:user_name>/<string:password>", methods=["GET"])
        def register(first_name,last_name,mail,user_name,password):
            
            result=authentication.add_user(User(user_name,first_name,last_name,mail),password)
            return jsonify(result)
        @app.route("/run/<string:user>", methods=["GET"])
        def run_script(user):
            result = os.system("python3 ./client.py "+user+" "+self.serverAddress+" "+self.serverPort+"")
            return jsonify(result)
        @app.route("/setImage/<string:user>", methods=["POST"])
        def setImage(user):
            img=request.get_json()
            path='./images/images.json'
            if not os.path.exists(path):
                # Create the file and write an empty dictionary
                dir_name = os.path.dirname(path)
                if not os.path.exists(dir_name):
                    os.makedirs(dir_name)
                with open(path, 'w') as f:
                    json.dump({}, f)
            with open(path, 'r') as f:
                data = json.load(f)
            data[user]=img
            result=""
            with open(path, 'w') as f:
                result=json.dump(data, f)
            return jsonify(result)
        @app.route("/getImage/<string:user>", methods=["GET"])
        def getImage(user):
            path='./images/images.json'
            with open(path, 'r') as f:
                data = json.load(f)
            if user in data:
                img=data[user]
            else:
                img=""
            return jsonify(img)
        app.run()

    def sighandler(self, signum, frame):
        # Close the server
        print('Shutting down server...')

        # Close existing client sockets
        for o in self.outputs:
            o.close()

        self.server.close()

    def getname(self, client):
        # Return the printable name of the
        # client, given its socket...
        info = self.clientmap[client]
        host, name = info[0][0], info[1]
        return '@'.join((name, host))

    def get_just_name(self, client):
        return self.clientmap[client][1]

    def send_encrypted(self, to_who, message, name):
        try:
            if not to_who == "chatroom":
                
                encryptor = self.clientmap[to_who][2]
                msg = encryptor.encrypt(message.encode(), 0)
                send(to_who, msg)
            else:
                if "]>> " in message:
                        putMessage("chatroom",message.split("]>> ")[1],"recieved",message.split("[")[1].split("@")[0])

        except IOError:
            send(to_who, 'PLAIN: cannot find public key for: %s' % name)

    def verify_signature(self, client, message, signature):
        try:
            key = self.clientmap[client][2]
            msg_hash = SHA.new()
            msg_hash.update(message)
            
            signature=ast.literal_eval(signature)

            verifier = PKCS1_PSS.new(key)
            return verifier.verify(msg_hash, signature)

        except IOError:
            return False

    def serve(self):
        inputs = [self.server, sys.stdin]
        self.outputs = []

        running = 1

        while running:
            try:
                inputready, outputready, exceptready = select.select(inputs, self.outputs, [])

            except select.error:
                break

            except socket.error:
                break

            for s in inputready:
                if s == self.server:
                    # handle the server socket
                    client, address = self.server.accept()
                    print('chatserver: got connection %d from %s' % (client.fileno(), address))
                    # Get client public key and send our public key
                    pubkey = RSA.importKey(receive(client))
                    send(client, self.server_pubkey.exportKey())
                    
                    inputString=receive(client)
                    # Read the login name
                    cname =  inputString.split('NAME: ')[1].split(' ')[0]
                    port = inputString.split('PORT: ')[1]
                    # Compute client name and send back
                    self.clients += 1
                    send(client, 'CLIENT: ' + str(address[0]))
                    inputs.append(client)

                    self.clientmap[client] = (address, cname, pubkey,port)

                    # Send joining information to other clients
                    msg = '\n(Connected: New client (%d) from %s)' % (self.clients, self.getname(client))

                    for o in self.outputs:
                        try:
                            self.send_encrypted(o, msg, self.get_just_name(o))

                        except socket.error:
                            self.outputs.remove(o)
                            inputs.remove(o)

                    self.outputs.append(client)

                elif s == sys.stdin:
                    # handle standard input
                    sys.stdin.readline()
                    running = 0
                else:

                    # handle all other sockets
                    try:
                        data = receive(s)
                        if data:
                            dataparts = data.split('#^[[')
                            signature = dataparts[1]
                            data = dataparts[0]
                            reciever=dataparts[2]
                            data=ast.literal_eval(data)

                            verified = self.verify_signature(s, data, signature)
                            data = self.server_privkey.decrypt(data)
                            data=data.decode()
                            if data != '\x00':
                                if verified:
                                    data = '%sok' % data

                                else:
                                    data = '%sno' % data

                                # Send as new client's message...
                                msg = '\n# [' + self.getname(s) + ']>> ' + data
                                # Send data to all except ourselves
                                recieverClient=""
                                
                                if reciever == "chatroom":
                                    self.send_encrypted("chatroom", msg, self.get_just_name(s))
                                else:
                                    for o in self.clientmap:
                                        n=self.get_just_name(o)
                                        if n==reciever:
                                            recieverClient=o
                                            self.send_encrypted(recieverClient, msg, self.get_just_name(s))
                                            break
                                

                                    
                                
                        else:

                            print('Chatserver: Client %d hung up' % s.fileno())
                            self.clients -= 1
                            s.close()
                            inputs.remove(s)
                            self.outputs.remove(s)

                            # Send client leaving information to others
                            msg = '\n(Hung up: Client from %s)' % self.getname(s)

                            for o in self.outputs:
                                self.send_encrypted(o, msg, self.get_just_name(o))

                    except socket.error:
                        # Remove
                        inputs.remove(s)
                        self.outputs.remove(s)

            sleep(0.1)

        self.server.close()
