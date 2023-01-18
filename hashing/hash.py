import hashlib


class Hash:
    @staticmethod
    def md5(msg):
        return hashlib.md5(msg.encode()).hexdigest()

    @staticmethod
    def sha1(msg):
        return hashlib.sha1(msg.encode()).hexdigest()
    
    @staticmethod
    def sha32(msg):
        return hashlib.sha (msg.encode()).hexdigest()

    @staticmethod
    def sha256(msg):
        return hashlib.sha256(msg.encode()).hexdigest()
