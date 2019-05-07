# https://stackoverflow.com/questions/19306976/python-shuffling-with-a-parameter-to-get-the-same-result

###################################################################

import random
import os
import string

###################################################################

CRYPTSEED = os.environ.get("CRYPTSEED", 0)

RANDOM = random.Random(CRYPTSEED)

ALPHANUM = list(string.ascii_letters + string.digits)
ALPHANUM_TRANSLATIONS = list(string.ascii_letters + string.digits)
RANDOM.shuffle(ALPHANUM_TRANSLATIONS)

ENCRYPT_ALPHANUM = dict(zip(ALPHANUM, ALPHANUM_TRANSLATIONS))
DECRYPT_ALPHANUM = dict(zip(ALPHANUM_TRANSLATIONS, ALPHANUM))

###################################################################

def crypt(content, translation):
    return "".join([translation[x] for x in list(content)])

def encryptalphanum(content):
    return crypt(content, ENCRYPT_ALPHANUM)

def decryptalphanum(content):
    return crypt(content, DECRYPT_ALPHANUM)

###################################################################

def alphanumtest():
    o = "SDKSJDKJkjfaeijfoj8FJDHJ8998jhjhj"
    print("o", o)
    e = encryptalphanum(o)
    print("e", e)
    d = decryptalphanum(e)
    print("d", d)
    print("o == d", o == d)

###################################################################
