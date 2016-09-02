let SessionLoad = 1
if &cp | set nocp | endif
let s:so_save = &so | let s:siso_save = &siso | set so=0 siso=0
let v:this_session=expand("<sfile>:p")
silent only
cd ~/Working/game_of_tides_4/backend
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
set shortmess=aoO
badd +1 data_transport.cc
badd +1 data_transport_ws.cc
badd +1 hello_cpp_world.cc
badd +1 logging.cc
badd +1 terrain.cc
badd +11 data_transport.h
badd +55 data_transport_ws.h
badd +1 logging.h
badd +1 terrain.h
badd +1 work.h
badd +0 work_queue.h
badd +1 tasks.h
argglobal
silent! argdel *
argadd data_transport.cc
argadd data_transport_ws.cc
argadd hello_cpp_world.cc
argadd logging.cc
argadd terrain.cc
argadd data_transport.h
argadd data_transport_ws.h
argadd logging.h
argadd terrain.h
argadd work.h
set stal=2
edit data_transport.cc
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
argglobal
let s:l = 54 - ((48 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
54
normal! 0
wincmd w
argglobal
edit data_transport.h
let s:l = 73 - ((44 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
73
normal! 036|
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
tabedit work_queue.h
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
argglobal
edit work_queue.h
let s:l = 28 - ((27 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
28
normal! 0
tabedit data_transport_ws.cc
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
argglobal
edit data_transport_ws.cc
let s:l = 2 - ((1 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
2
normal! 0
wincmd w
argglobal
edit data_transport_ws.h
let s:l = 55 - ((28 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
55
normal! 05|
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
tabedit hello_cpp_world.cc
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
argglobal
edit hello_cpp_world.cc
let s:l = 22 - ((21 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
22
normal! 016|
tabedit tasks.h
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
argglobal
let s:l = 1 - ((0 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
1
normal! 0
tabedit terrain.cc
set splitbelow splitright
wincmd _ | wincmd |
vsplit
1wincmd h
wincmd w
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
argglobal
edit terrain.cc
let s:l = 8 - ((7 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
8
normal! 0
wincmd w
argglobal
edit terrain.h
let s:l = 1 - ((0 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
1
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
tabnext 6
set stal=1
if exists('s:wipebuf')
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20 shortmess=filnxtToOc
let s:sx = expand("<sfile>:p:r")."x.vim"
if file_readable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &so = s:so_save | let &siso = s:siso_save
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
