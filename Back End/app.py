# ############################################################################
# IMPORTS
# ############################################################################
import os
import nltk
from nltk.corpus import wordnet as wn
from flask import Flask, jsonify, abort, make_response
from flask_cors import *

# ############################################################################
# MANUAL PATH OVERRIDE FOR NLTK WORD NET LIBS
# ############################################################################
nltk.data.path.append('./nltk_data/')

# ############################################################################
# DATA CONSTANTS & Cross Site Filters
# ############################################################################

app = Flask(__name__)
cor = CORS(app)

# ############################################################################
# NLTK Helper Methods
# ############################################################################

def get_synset_from_POS_offset(pos, offset):
    synset = wn._synset_from_pos_and_offset(pos,offset)
    return synset

def get_synsets_from_word(word):
    synsets = wn.synsets(word)
    return synsets

def parseNameFromSynset(syn):
    return syn.name().split('.')[0]


# ############################################################################
# DataStructure Methods
# ############################################################################

def get_synset_hyponyms_hypernyms(syn):
    fs=[]
    for i in syn.hyponyms():
        struc={
            "word":parseNameFromSynset(i),
            "definition": str(i.definition()),
            "group":str(i.pos()),
            "clickable" : 'true',
            "visible" : 'true',
            "identifier" : 'word-hyponym',
            "examples": get_synset_examples(i),
            "offset":i.offset()
        }
        fs.append(struc)
        
    for i in syn.hypernyms():
        struc={"word":parseNameFromSynset(i),
               "definition": str(i.definition()),
               "group":str(i.pos()),
               "clickable" : 'true',
               "visible" : 'true',
               "identifier" : 'word-hypernym',
               "examples": get_synset_examples(i),
               "offset":i.offset()}
        fs.append(struc)
    return fs
            

def get_synset_hypernyms(syn):
    fs=[]
    for i in syn.hypernyms():
        struc={"word":parseNameFromSynset(i),
               "group":str(i.pos()),
               "clickable" : 'true',
               "visible" : 'true',
               "identifier" : 'word-hypernym',
               "offset":i.offset()}
        fs.append(struc)
    return fs

def get_synset_examples(syn):
    fs = []
    for i in syn.examples():
        struc =  { "example": str(i)}        
        fs.append(struc)
    return fs


# #
# Methods v0.01
# #
def getChildren(synonyms): 
    fstruc = []
    for i in synonyms:
        struc =  { "name": str(i.definition()),
                   "group": str(i.pos()),
                   "children": get_synset_examples(i)
                   }
        
        fstruc.append(struc)
    return fstruc

def buildListStructure(inputWord):
    wordSet = wn.synsets(inputWord)
    fullStructure = []    
    fullStructure.append( {"word": str(inputWord),
                           "group": str(wordSet[0].pos()),
                           "children" : getChildren(wordSet)})
    return fullStructure

# #
# Methods v1.01
# #

# ######
# Builds a child list of entities contained within individual synsets in a given list
# ######
def extract_child_nodes(synonyms): 
    fstruc = []
    for i in synonyms:
        struc =  { "word": parseNameFromSynset(i),
                   "definition": str(i.definition()),
                   "group": str(i.pos()),
                   "offset": i.offset(),
                   "examples": get_synset_examples(i),
                   "clickable" : 'false',
                   "visible" : 'true',
                   "identifier" : 'word-synset',
                   "children": get_synset_hyponyms_hypernyms(i) #this should be called hypernyms
                   }
        
        fstruc.append(struc)
    return fstruc

# ######
# Returns a json structure for a given list of synsets
# ######
def build_json_for_root_node(wordset, word):
    fullStructure = []    
    fullStructure.append( {"word": word,
                           "clickable" : 'false',
                           "identifier" : 'word-root',
                           "visible" : 'true',
                           "children" : extract_child_nodes(wordset)})
    return fullStructure

# Returns a single json structure for a given synset
def build_json_for_portion_node(synset):
    fullStructure = []
    fullStructure.append( { "word": parseNameFromSynset(synset),
                   "definition": str(synset.definition()),
                   "group": str(synset.pos()),
                   "offset": synset.offset(),
                   "examples": get_synset_examples(synset),
                   "hypernyms": get_synset_hypernyms(synset)
                   })
    return fullStructure



# Returns a single json structure for a given synset
def build_json_for_portion_node_1(synset):
    fullStruc = []
    fullStruc.append ( {
        "children" : get_synset_hypernyms(synset),
        "definition" : (str(synset.definition())),
        "examples": get_synset_examples(synset)
        })
    
    return fullStruc

def get_synset_hyponyms_hypernyms_basic(syn):
    fs=[]
    for i in syn.hyponyms():
        struc={
            "word":parseNameFromSynset(i),
            "definition": str(i.definition()),
            "group":str(i.pos()),
            "identifier" : 'word-hyponym',
            "examples": get_synset_examples(i),
            "offset":i.offset()
        }
        fs.append(struc)      
    for i in syn.hypernyms():
        struc={"word":parseNameFromSynset(i),
               "definition": str(i.definition()),
               "group":str(i.pos()),
               "identifier" : 'word-hypernym',
               "examples": get_synset_examples(i),
               "offset":i.offset()}
        fs.append(struc)
    return fs

def extract_basic_child_nodes(wordset):
    fstruc = []
    for i in wordset:
        struc =  { "word": parseNameFromSynset(i),
                   "definition": str(i.definition()),
                   "group": str(i.pos()),
                   "offset": i.offset(),
                   "examples": get_synset_examples(i),          
                   "identifier" : 'word-synset',
                   "children": get_synset_hyponyms_hypernyms_basic(i) #this should be called hypernyms
                      }
           
        fstruc.append(struc)
    return fstruc

def build_json_for_basic_request(synsets, word):
    fullStructure = []    
    fullStructure.append( {"word": word,
                           "identifier" : 'word-root',
                           "children" : extract_basic_child_nodes(synsets)})
    return fullStructure    

# ############################################################################
#  Flask handlers 
# ############################################################################

@app.route('/word/<string:word_in>', methods=['GET'])
def get_WordInfo(word_in):
    word_set = wn.synsets(word_in)
    if (len(word_set) > 0 ):
        return jsonify({'words' : build_json_for_basic_request(word_set, word_in)})
    else:
        return jsonify({'words' : ''})
    
@app.route('/v1.01/word/<string:word_in>', methods=['GET'])
def get_WordInfo01(word_in):
    word_set = wn.synsets(word_in)
    if (len(word_set) > 0 ):
        return jsonify({'words' : build_json_for_root_node(word_set, word_in)})
    else:
        return jsonify({'words' : ''})
    
@app.route('/v1.01/offset/<string:pos>/<int:offset>', methods=['GET'])
def get_synset_from_pos_offset(pos,offset):
    word_set = wn._synset_from_pos_and_offset(pos,offset)
    return jsonify({'extended_information' : build_json_for_portion_node_1(word_set)})

# Global 500 Web error handler 
@app.errorhandler(500)
def handle_server_error(error):
    response = jsonify({'status' : 500, 'error' : 'internal server error, if error persists please check parameters'})
    return response

# Global 404 error handler
@app.errorhandler(404)
def not_found(error):
    return jsonify({'status' : 404, 'error': 'resource not found'})

@app.route('/forceError')
def force_error():
    return 10/0



# ############################################################################
# Start up the server
# Runs locally on port 5001 - on live port 80
# debugging OFF 
# ############################################################################

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=0)