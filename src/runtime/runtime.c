#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "runtime.h"

// Ref countable

void free_ref_countable(void * ref_countable) {
    RefCount ref_count = (RefCount)ref_countable;
    if (ref_count->count == 0) {
        ref_count->free_fn(ref_countable);
    }
}

void dec_and_free(void * ref_countable) {
    free_ref_countable(dec(ref_countable));
}

void * inc(void * ref_countable) {
    RefCount ref_count = (RefCount)ref_countable;
    ref_count->count++;
    return ref_countable;
}

void * dec(void * ref_countable) {
    RefCount ref_count = (RefCount)ref_countable;
    ref_count->count--;
    return ref_countable;
}

// Env

Env create_env(Env parent) {
    Env env = (Env)malloc(sizeof(struct env));
    env->ref_count.count = 0;
    env->ref_count.free_fn = &free_env;
    env->size = 0;
    env->pairs = (struct pair *)malloc(env->size * sizeof(struct pair));
    env->parent = parent;
    if (parent != NULL) {
        inc(parent);
    }
    return env;
}

void env_insert(Env env, char * key, void * ref_countable) {
    struct pair pair;
    pair.key = key;
    pair.ref_countable = inc(ref_countable);
    env->size++;
    env->pairs = (struct pair *)realloc(env->pairs, env->size * sizeof(struct pair));
    env->pairs[env->size - 1] = pair;
}

void * env_lookup(Env env, char * key) {
    int i;
    if (env == NULL) {
        printf("Did not find key '%s'\n", key);
        return NULL;
    }
    for (i = 0; i < env->size; i++) {
        if (strcmp(env->pairs[i].key, key) == 0) {
            return env->pairs[i].ref_countable;
        }
    }
    return env_lookup(env->parent, key);
}

void free_env(void * ref_countable) {
    Env env = (Env)ref_countable;
    int i;
    for (i = 0; i < env->size; i++) {
        dec_and_free(env->pairs[i].ref_countable);
    }
    free(env->pairs);
    if (env->parent != NULL) {
        dec_and_free(env->parent);
    }
    free(env);
}

// Args

Args create_args(int size) {
    Args args = (Args)malloc(sizeof(struct args));
    args->ref_count.count = 0;
    args->ref_count.free_fn = &free_args;
    args->size = size;
    args->args = (void **)malloc(args->size * sizeof(void *));
    return args;
}

void args_set(Args args, int i, void * ref_countable) {
    args->args[i] = inc(ref_countable);
}

void * args_get(Args args, int i) {
    return args->args[i];
}

void free_args(void * ref_countable) {
    Args args = (Args)ref_countable;
    int i;
    for (i = 0; i < args->size; i++) {
        dec_and_free(args->args[i]);
    }
    free(args->args);
    free(args);
}

// Closure

Closure create_closure(FnSpec fn_spec, Env env) {
    Closure closure = (Closure)malloc(sizeof(struct closure));
    closure->ref_count.count = 0;
    closure->ref_count.free_fn = &free_closure;
    closure->fn_spec = fn_spec;
    closure->env = (Env)inc(env);
    return closure;
}

void free_closure(void * ref_countable) {
    Closure closure = (Closure)ref_countable;
    dec_and_free(closure->env);
    free(closure);
}

// Call

Call create_call(Closure closure, Args args) {
    Call call = (Call)malloc(sizeof(struct call));
    call->ref_count.count = 0;
    call->ref_count.free_fn = &free_call;
    call->closure = (Closure)inc(closure);
    call->args = (Args)inc(args);
    return call;
}

void free_call(void * ref_countable) {
    Call call = (Call)ref_countable;
    dec_and_free(call->closure);
    dec_and_free(call->args);
    free(call);
}

// Constants

Number const_number(double i) {
    Number number = (Number)malloc(sizeof(struct number));
    number->ref_count.count = 0;
    number->ref_count.free_fn = &free_number;
    number->value = i;
    return number;
}

void free_number(void * ref_countable) {
    Number number = (Number)ref_countable;
    free(number);
}
