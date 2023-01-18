from server import ChatServer

import sys

if __name__ == "__main__":

    if len(sys.argv) < 3:
        sys.exit('Usage: %s listen_ip listen_port' % sys.argv[0])
    server_instance=ChatServer(sys.argv[1], sys.argv[2])
    server_instance.serve()