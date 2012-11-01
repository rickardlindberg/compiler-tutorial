module ParseTree where

data Program = Program [Let]

data Let     = Let String Term

data Term    = Identifier String
             | Number     Integer
             | Lambda     [String] [Term]
