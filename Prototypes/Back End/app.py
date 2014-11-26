# ############################################################################
# IMPORTS
# ############################################################################
import os
import nltk
import pickle
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
# Methods
# ############################################################################

def parseNameFromSynset(syn):
    return syn.name().split('.')[0]


def getSynsetHypernyms(syn):
    fs=[]
    for i in syn.hypernyms():
        struc={"word":parseNameFromSynset(i),
               "group":str(i.pos()),
               "offset":i.offset()}
        fs.append(struc)
    return fs

def getSynsetExamples(syn):
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
                   "children": getSynsetExamples(i)
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
                   "examples": getSynsetExamples(i),
                   "hypernyms": getSynsetHypernyms(i)
                   }
        
        fstruc.append(struc)
    return fstruc

# ######
# Returns a json structure for a given list of synsets
# ######
def build_json_for_root_node(wordset):
    fullStructure = []    
    fullStructure.append( {"word": parseNameFromSynset(wordset[0]),
                           "children" : extract_child_nodes(wordset)})
    return fullStructure

# Returns a single json structure for a given synset
def build_json_for_portion_node(synset):
    fullStructure = []
    fullStructure.append( { "word": parseNameFromSynset(synset),
                   "definition": str(synset.definition()),
                   "group": str(synset.pos()),
                   "offset": synset.offset(),
                   "examples": getSynsetExamples(synset),
                   "hypernyms": getSynsetHypernyms(synset)
                   })
    return fullStructure

# ############################################################################
#  Flask handlers 
# ############################################################################

@app.route('/word/<string:word_in>', methods=['GET'])
def get_WordInfo(word_in):
    return jsonify({'words' : buildListStructure(word_in)})

@app.route('/v1.01/word/<string:word_in>', methods=['GET'])
def get_WordInfo01(word_in):
    word_set = wn.synsets(word_in)
    return jsonify({'words' : build_json_for_root_node(word_set)})

@app.route('/v1.01/offset/<string:pos>/<int:offset>', methods=['GET'])
def get_synset_from_pos_offset(pos,offset):
    word_set = wn._synset_from_pos_and_offset(pos,offset)
    return jsonify({'word' : build_json_for_portion_node(word_set)})    

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'not found'}), 404)


# ############################################################################
# Start up the server
# Local set up debugging on 
# ############################################################################

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=1)