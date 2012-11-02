module CodeGeneratorFramework where

import Control.Monad.Trans.State.Lazy as ST

runGenerator :: ST.State AccumulatedCode a -> String
runGenerator m = includesStr ++ bodyCode st
    where
        st = ST.execState m (AccumulatedCode 0 [] [] "" 0)
        includesStr = concatMap (\x -> "#include " ++ x ++ "\n") (includes st)

data AccumulatedCode = AccumulatedCode
    { counter     :: Int
    , globalNames :: [(String, String)]
    , includes    :: [String]
    , bodyCode    :: String
    , indentCount :: Int
    }

addInclude :: String -> ST.State AccumulatedCode ()
addInclude include = ST.modify (\s -> s { includes = update (includes s) })
    where
        update x | include `elem` x = x
                 | otherwise        = x ++ [include]

writeLine :: String -> ST.State AccumulatedCode ()
writeLine line = ST.modify (\s -> s { bodyCode = bodyCode s ++ newLine s })
    where
        newLine   s = indentStr s ++ line ++ "\n"
        indentStr s = if null line
                          then ""
                          else concatMap (const "    ") [1..indentCount s]

indented :: ST.State AccumulatedCode () -> ST.State AccumulatedCode ()
indented gen = indent >> gen >> dedent

indent :: ST.State AccumulatedCode ()
indent = ST.modify (\s -> s { indentCount = indentCount s + 1 })

dedent :: ST.State AccumulatedCode ()
dedent = ST.modify (\s -> s { indentCount = indentCount s - 1 })

addGlobalName :: String -> String -> ST.State AccumulatedCode ()
addGlobalName name code = ST.modify (\s -> s { globalNames = (name, code):globalNames s })

nextCounter :: ST.State AccumulatedCode Int
nextCounter = do
    state <- get
    ST.modify (\s -> s { counter = counter s + 1 })
    return $ counter state
