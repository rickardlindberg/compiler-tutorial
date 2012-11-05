import CodeGeneratorFramework

outCode :: CodeGenerator ()
outCode = do
    writeLine "#include <stdio.h>"
    writeLine ""
    writeLine "int main() {"
    indented $ do
        writeLine "printf(\"hello world\\n\");"
        writeLine "return 0;"
    writeLine "}"

main = do
    putStr $ runGenerator outCode
