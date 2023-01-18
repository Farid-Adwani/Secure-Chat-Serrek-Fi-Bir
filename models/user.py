class User:
    def __init__(self,user_name, first_name, last_name, mail):
        self.user_name = user_name
        self.first_name = first_name
        self.last_name = last_name
        self.mail = mail

    def __str__(self):
        return "--------- Printing User Data ----------\n"+"User name: {}\nFirst name: {}\nLast name: {}\nmail: {}".format(self.user_name,self.first_name, self.last_name, self.mail)+"\n---------------------------------------"
