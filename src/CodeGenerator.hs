module CodeGenerator where

import CodeGenerationFramework
import Control.Monad
import Control.Monad.Trans.State.Lazy as ST
import Data.Maybe
import ParseTree
import qualified Data.Map as M

generateCode :: Program -> String
generateCode = runGenerator . outProgram

outProgram :: Program -> CodeGenerator ()
outProgram (Program lets) = do
    addGlobalName "exit"     "create_closure(&builtin_exit, env)"
    addGlobalName "setTempo" "create_closure(&builtin_setTempo, env)"
    addGlobalName "setBeat"  "create_closure(&builtin_setBeat, env)"
    writeLine "#include \"runtime.h\""
    writeLine "#include <stdlib.h>"
    writeLine ""
    mapM_ outLet lets
    outMain

outLet :: Let -> CodeGenerator ()
outLet (Let name term) = outTerm term >>= addGlobalName name

outTerm :: Term -> CodeGenerator String
outTerm (Identifier s)   = return $ "env_lookup(env, \"" ++ s ++ "\")"
outTerm (Number     n)   = return $ "const_number(" ++ show n ++ ")"
outTerm (Lambda     a t) = outFunction $ Lambda a t

outFunction :: Term -> CodeGenerator String
outFunction (Lambda args terms) = do
    n <- nextCounter
    terms <- mapM outTerm terms
    writeLine $ "Call fn_" ++ show n ++ "(Env parent_env, Args args) {"
    indented $ do
        writeLine $ "Args next_args;"
        writeLine $ "Closure closure;"
        writeLine $ "Env env;"
        writeLine $ ""
        writeLine $ "env = create_env(parent_env);"
        forM (zip [0..] args) $ \(i, arg) -> do
            writeLine $ "env_insert(env, \"" ++ arg ++ "\", args_get(args, " ++ show i ++ "));"
        writeLine $ ""
        writeLine $ "closure = (Closure)" ++ head terms ++ ";"
        writeLine $ ""
        writeLine $ "next_args = create_args(" ++ show (length (tail terms)) ++ ");"
        forM (zip [0..] (tail terms)) $ \(i, term) -> do
            writeLine $ "args_set(next_args, " ++ show i ++ ", " ++ term ++ ");"
        writeLine $ ""
        writeLine $ "free_ref_countable(env);"
        writeLine $ ""
        writeLine $ "return create_call(closure, next_args);"
    writeLine $ "}"
    writeLine ""
    return $ "create_closure(&fn_" ++ show n ++ ", env)"

outMain :: CodeGenerator ()
outMain = do
    state <- get
    writeLine "void con_main() {"
    indented $ do
        writeLine "Env env;"
        writeLine "Call call, next_call;"
        writeLine ""
        writeLine "env = create_env(NULL);"
        forM (globalNames state) $ \(name, code) -> do
            writeLine $ "env_insert(env, \"" ++ name ++ "\", " ++ code ++ ");"
        writeLine ""
        writeLine "call = create_call((Closure)env_lookup(env, \"main\"), create_args(0));"
        writeLine ""
        writeLine "while (call != NULL) {"
        indented $ do
            writeLine "next_call = call->closure->fn_spec(call->closure->env, call->args);"
            writeLine "free_ref_countable(call);"
            writeLine "call = next_call;"
        writeLine "}"
        writeLine ""
        writeLine "free_ref_countable(env);"
    writeLine "}"
