module Parser where

import Control.Monad
import ParseTree
import qualified Text.ParserCombinators.Parsec.Token as P
import Text.ParserCombinators.Parsec
import Text.ParserCombinators.Parsec.Language (haskellDef)
import Text.ParserCombinators.Parsec.Token (makeTokenParser)

parseCon :: String -> Either ParseError Program
parseCon input = parse translate "" input

translate :: Parser Program
translate  =  do whiteSpace
                 p <- program
                 eof
                 return p
program    =  fmap Program (many letp)
letp       =  do reserved "let"
                 name <- identifier
                 symbol "="
                 t <- term
                 return (Let name t)
term       =  fmap Identifier identifier
          <|> fmap Number     natural
          <|> do symbol "\\("
                 args <- sepBy identifier (symbol ",")
                 symbol ")"
                 symbol "->"
                 terms <- many1 term
                 return (Lambda args terms)
          <|> parens term

whiteSpace = P.whiteSpace lexer
symbol     = P.symbol     lexer
natural    = P.natural    lexer
identifier = P.identifier lexer
reserved   = P.reserved   lexer
parens     = P.parens     lexer
lexer      = makeTokenParser $ haskellDef
             { P.reservedNames = ["let"]
             , P.identLetter   = P.identLetter haskellDef <|> char '?' <|> char '-'
             }
