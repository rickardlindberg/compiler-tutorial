module Main where

import CodeGenerator
import Parser
import System.Environment
import System.Exit

main :: IO ()
main = do
    [inFile, outFile] <- getArgs
    inContent <- readFile inFile
    case parseCon inContent of
        Left error      -> print error >> exitFailure
        Right parseTree -> writeFile outFile (generateCode parseTree)
    exitSuccess
