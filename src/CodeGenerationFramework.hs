module CodeGenerationFramework where

import Control.Monad.Trans.State.Lazy as ST

type CodeGenerator a = ST.State AccumulatedCode a

runGenerator :: CodeGenerator () -> String
runGenerator m = code $ ST.execState m (AccumulatedCode 0 [] "" 0)

data AccumulatedCode = AccumulatedCode
    { counter     :: Int
    , globalNames :: [(String, String)]
    , code        :: String
    , indentCount :: Int
    }

writeLine :: String -> CodeGenerator ()
writeLine line = ST.modify (\s -> s { code = code s ++ newLine s })
    where
        newLine   s = indentStr s ++ line ++ "\n"
        indentStr s = if null line
                          then ""
                          else concatMap (const "    ") [1..indentCount s]

indented :: CodeGenerator () -> CodeGenerator ()
indented gen = indent >> gen >> dedent

indent :: CodeGenerator ()
indent = ST.modify (\s -> s { indentCount = indentCount s + 1 })

dedent :: CodeGenerator ()
dedent = ST.modify (\s -> s { indentCount = indentCount s - 1 })

addGlobalName :: String -> String -> CodeGenerator ()
addGlobalName name code = ST.modify (\s -> s { globalNames = (name, code):globalNames s })

nextCounter :: CodeGenerator Int
nextCounter = do
    state <- get
    ST.modify (\s -> s { counter = counter s + 1 })
    return $ counter state
