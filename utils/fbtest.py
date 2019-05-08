#######################################################
#
# https://firebase.google.com/docs/firestore/quickstart
#
#######################################################

###################################################

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

###################################################

cred = credentials.Certificate("firebase/sacckey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

###################################################

doc_ref = db.collection(u'users').document(u'alovelace')

doc_ref.set({
    u'first': u'Ada',
    u'last': u'Lovelace',
    u'born': 1815
})

doc_ref = db.collection(u'users').document(u'aturing')

doc_ref.set({
    u'first': u'Alan',
    u'middle': u'Mathison',
    u'last': u'Turing',
    u'born': 1912
})

###################################################

users_ref = db.collection(u'users')

docs = users_ref.stream()

for doc in docs:
    print(u'{} => {}'.format(doc.id, doc.to_dict()))

###################################################
