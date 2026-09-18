// Fitur Sanitasi Firebase — nama orang dipakai sebagai key object (individualStatus,
// pengawasanDetails), padahal Firebase RTDB key tidak boleh mengandung . # $ [ ] /
export const encodeKey = (k) => typeof k === 'string' ? k.replace(/\./g, '__DOT__').replace(/#/g, '__HASH__').replace(/\$/g, '__DOLLAR__').replace(/\[/g, '__LBRACK__').replace(/\]/g, '__RBRACK__').replace(/\//g, '__SLASH__') : k;
export const decodeKey = (k) => typeof k === 'string' ? k.replace(/__DOT__/g, '.').replace(/__HASH__/g, '#').replace(/__DOLLAR__/g, '$').replace(/__LBRACK__/g, '[').replace(/__RBRACK__/g, ']').replace(/__SLASH__/g, '/') : k;
