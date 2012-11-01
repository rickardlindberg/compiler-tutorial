module Parser where

import ParseTree
import Text.ParserCombinators.Parsec

parseCon :: String -> Either ParseError Program
parseCon input = parse programParser "" input

programParser :: Parser Program
programParser = return $ Program []
