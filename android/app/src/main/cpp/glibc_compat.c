#include <stdio.h>
#include <stdarg.h>
#include <stdint.h>
#include <ctype.h>
#include <string.h>

#ifdef __cplusplus
extern "C" {
#endif

static unsigned short glibc_b_table[384];
static const unsigned short *glibc_b_ptr = &glibc_b_table[128];

static int32_t glibc_tolower_table[384];
static const int32_t *glibc_tolower_ptr = &glibc_tolower_table[128];

static int32_t glibc_toupper_table[384];
static const int32_t *glibc_toupper_ptr = &glibc_toupper_table[128];

static int tables_initialized = 0;

static void init_tables(void) {
    if (tables_initialized) return;
    for (int i = -128; i < 256; i++) {
        int idx = i + 128;
        unsigned char c = (unsigned char)i;
        unsigned short mask = 0;
        if (isupper(c)) mask |= 0x0100;
        if (islower(c)) mask |= 0x0200;
        if (isalpha(c)) mask |= 0x0400;
        if (isdigit(c)) mask |= 0x0800;
        if (isxdigit(c)) mask |= 0x1000;
        if (isspace(c)) mask |= 0x2000;
        if (isprint(c)) mask |= 0x4000;
        if (isgraph(c)) mask |= 0x8000;
        if (isblank(c)) mask |= 0x0001;
        if (iscntrl(c)) mask |= 0x0002;
        if (ispunct(c)) mask |= 0x0004;
        if (isalnum(c)) mask |= 0x0008;

        glibc_b_table[idx] = mask;
        glibc_tolower_table[idx] = tolower(c);
        glibc_toupper_table[idx] = toupper(c);
    }
    tables_initialized = 1;
}

__attribute__((visibility("default")))
const unsigned short int * const * __ctype_b_loc(void) {
    if (!tables_initialized) init_tables();
    return &glibc_b_ptr;
}

__attribute__((visibility("default")))
const int32_t * const * __ctype_tolower_loc(void) {
    if (!tables_initialized) init_tables();
    return &glibc_tolower_ptr;
}

__attribute__((visibility("default")))
const int32_t * const * __ctype_toupper_loc(void) {
    if (!tables_initialized) init_tables();
    return &glibc_toupper_ptr;
}

__attribute__((visibility("default")))
size_t __ctype_get_mb_cur_max(void) {
    return 4;
}

__attribute__((visibility("default")))
int __isoc99_fscanf(FILE *stream, const char *format, ...) {
    va_list args;
    va_start(args, format);
    int ret = vfscanf(stream, format, args);
    va_end(args);
    return ret;
}

__attribute__((visibility("default")))
int bcmp(const void *s1, const void *s2, size_t n) {
    return memcmp(s1, s2, n);
}

__attribute__((visibility("default")))
size_t _ZNSt6__ndk113__hash_memoryEPKvm(const void* ptr, size_t len) {
    const size_t m = 0xc6a4a7935bd1e995ULL;
    const int r = 47;
    size_t h = len * m;
    const size_t* data = (const size_t*)ptr;
    const size_t* end = data + (len / 8);
    while (data != end) {
        size_t k = *data++;
        k *= m;
        k ^= k >> r;
        k *= m;
        h ^= k;
        h *= m;
    }
    const unsigned char* data2 = (const unsigned char*)end;
    switch (len & 7) {
    case 7: h ^= (size_t)data2[6] << 48;
    case 6: h ^= (size_t)data2[5] << 40;
    case 5: h ^= (size_t)data2[4] << 32;
    case 4: h ^= (size_t)data2[3] << 24;
    case 3: h ^= (size_t)data2[2] << 16;
    case 2: h ^= (size_t)data2[1] << 8;
    case 1: h ^= (size_t)data2[0];
            h *= m;
    };
    h ^= h >> r;
    h *= m;
    h ^= h >> r;
    return h;
}

__attribute__((weak, visibility("default")))
void *__tls_get_addr(void *arg) {
    return arg;
}

#ifdef __cplusplus
}
#endif
