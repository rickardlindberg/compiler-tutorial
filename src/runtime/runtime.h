#ifndef RUNTIME_H
#define RUNTIME_H

typedef struct ref_count * RefCount;
typedef struct env       * Env;
typedef struct args      * Args;
typedef struct closure   * Closure;
typedef struct call      * Call;
typedef struct number    * Number;

typedef Call (*FnSpec)(Env env, Args args);
typedef void (*FnFree)(void *);

// Ref countable

struct ref_count {
    int count;
    FnFree free_fn;
};

void free_ref_countable(void * ref_countable);
void dec_and_free(void * ref_countable);
void * inc(void * ref_countable);
void * dec(void * ref_countable);

// Env

struct pair {
    char * key;
    void * ref_countable;
};

struct env {
    struct ref_count ref_count;
    int size;
    struct pair * pairs;
    struct env * parent;
};

Env create_env(Env parent);
void env_insert(Env env, char * key, void * ref_countable);
void * env_lookup(Env env, char * key);
void free_env(void * env);

// Args

struct args {
    struct ref_count ref_count;
    int size;
    void ** args;
};

Args create_args(int size);
void args_set(Args args, int i, void * ref_countable);
void * args_get(Args args, int i);
void free_args(void * args);

// Closure

struct closure {
    struct ref_count ref_count;
    FnSpec fn_spec;
    Env env;
};

Closure create_closure(FnSpec fn_spec, Env env);
void free_closure(void * closure);

// Call

struct call {
    struct ref_count ref_count;
    Closure closure;
    Args args;
};

Call create_call(Closure closure, Args args);
void free_call(void * call);

// Constants

struct number {
    struct ref_count ref_count;
    double value;
};

Number const_number(double i);
void free_number(void * number);

#endif
