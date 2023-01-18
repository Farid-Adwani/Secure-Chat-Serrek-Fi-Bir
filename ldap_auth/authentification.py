from ldap3 import Server, Connection, ALL, SUBTREE, MODIFY_REPLACE
from ldap3.core.exceptions import LDAPException, LDAPBindError
import logging
from hashing.hash import Hash
from models.user import User
import data.constants as CONSTANTS


def connect_ldap_server():

    try:
        
        # Provide the hostname and port number of the openLDAP      
        server_uri = CONSTANTS.server_uri
        server = Server(server_uri, get_info=ALL)
        
        # username and password can be configured during openldap setup
        connection = Connection(server,          
                                user='cn={},dc={}'.format(CONSTANTS.admin_cn,CONSTANTS.root_group), 
                                password=CONSTANTS.admin_password)
        bind_response = connection.bind() # Returns True or False 
        # print("Admin verified successfully.")
        return connection
    except LDAPBindError as e:
        connection = e

def get_ldap_users():
    
    # Provide a search base to search for.
    search_base = 'dc=insat'
    # provide a uidNumber to search for. '*" to fetch all users/groups
    search_filter = '(cn=*)'

    # Establish connection to the server
    ldap_conn = connect_ldap_server()
    try:
        # only the attributes specified will be returned
        ldap_conn.search(search_base=search_base,       
                         search_filter=search_filter,
                         search_scope=SUBTREE, 
                         attributes=['cn','sn','uid','uidNumber','givenName','mail','userPassword'])
        # search will not return any values.
        # the entries method in connection object returns the results 
        results = ldap_conn.entries
        usersDto=[]
        for user in results:
            user=user.entry_attributes_as_dict
            if not user["cn"][0]=="admin":
                usersDto.append({
                "user_name":user["cn"][0] if len(user["cn"])>0 else "",
                "first_name":user["givenName"][0] if len(user["givenName"])>0 else "",
                "last_name":user["sn"][0] if len(user["sn"])>0 else "",
                "mail":user["mail"][0] if len(user["mail"])>0 else "",
            })
        
        # print(results)
        # print(type(results))
        
    except LDAPException as e:
        results = e
    return usersDto

def add_user(user,password):
    if user.user_name.count(' ')>0:
        print("user_name should not contain space !")
        return "error user_name with space"
    
    if not getUser(user.user_name)==False:
        return -1
    # sample attributes 
    attrs = {
    # 'objectClass': ['person', 'organizationalPerson'],
    'cn': user.user_name,
    'sn': user.last_name,
    'givenName': user.first_name,
    'mail': user.mail,
    'userPassword': Hash.sha256(password)
    }


    # Bind connection to LDAP server
    ldap_conn = connect_ldap_server()

    # this will create testuser inside group1
    user_dn = "cn={},dc={}".format(attrs['cn'],CONSTANTS.root_group)

    try:
        # object class for a user is inetOrgPerson
        response = ldap_conn.add(dn=user_dn,
                                 object_class='inetOrgPerson',
                                 attributes=attrs)
    except LDAPException as e:
        print(e)
    return 1

def delete_user(user_name):
    ldap_conn = connect_ldap_server()
    # Provide the dn of the user to be deleted 
    try:                          
        response=ldap_conn.delete(dn='cn={},dc={}'.format(user_name,CONSTANTS.root_group))
    except LDAPException as e:
       response = e
    return response

def update_user(user_name,updates):
    connection=connect_ldap_server()
    map_to_update={}
    for key in updates:
        if(key=="first_name"):
            map_to_update["givenName"]=[(MODIFY_REPLACE, [updates[key]])]
        if(key=="last_name"):
            map_to_update["sn"]=[(MODIFY_REPLACE, [updates[key]])]
        if(key=="mail"):
            map_to_update["mail"]=[(MODIFY_REPLACE, [updates[key]])]
    print(map_to_update)
    # Provide the dn of the user to be deleted 
    connection.modify('cn={},dc={}'.format(user_name,CONSTANTS.root_group),
         map_to_update)
    return connection.result

def sign_in(user_name, password):
    connection=valid_user(user_name,password)
    if connection.result['result']==0:
        return {
            # "connection":connection,
            "user":getUser(user_name),
        }
    else:
        return{
            # "connection":connection,
        }

def valid_user(user_name, password):
        user_name="cn={},dc={}".format(user_name,CONSTANTS.root_group)
        server_uri = f"ldap://localhost:389"
        server = Server(server_uri, get_info=ALL)
        conn = Connection(
            server, user=user_name, password=Hash.sha256(password), check_names=True, lazy=False, raise_exceptions=False
        )

        try:
            conn.open()
        except Exception as e:
            print(e)
            return 'conexion failed'

        conn.bind()
        if not (
                ('result' in conn.result and 0 == conn.result['result'])
                and
                ('description' in conn.result and 'success' == conn.result['description'])
        ):
            print('authentication failed !')
        else:
            print('authentication succeeded :)')
        return conn

def getUser(user_name):
    
    # Provide a search base to search for.
    search_base = 'dc={}'.format(CONSTANTS.root_group)
    # provide a uidNumber to search for. '*" to fetch all users/groups
    search_filter = '(cn={})'.format(user_name)

    # Establish connection to the server
    ldap_conn = connect_ldap_server()
    try:
        # only the attributes specified will be returned
        ldap_conn.search(search_base=search_base,       
                         search_filter=search_filter,
                         search_scope=SUBTREE, 
                         attributes=['cn','givenName','sn','mail'])
        # search will not return any values.
        # the entries method in connection object returns the results 
        results = ldap_conn.entries
        if len(results)<1:
            return False
        return User(user_name=results[0]["cn"],first_name=results[0]["givenName"],last_name=results[0]["sn"],mail=results[0]["mail"])
    except LDAPException as e:
        results = e 
  
  


# x=User(user_name="oussama",
#        first_name="Oussama",
#        last_name="Drz",
#        mail="drz@gmail.com")
# print(add_user(x,"oussama"))
# delete_user()
# update_user()
# sign_in('Farid-Adwani','farid')
# update_user("Farid-Adwani",{"first_name":"farhoud","last_name":"adwani","mail":"farid8569@gmail.com"})

# print(getUser("Farid-Adwani"))
get_ldap_users()




        