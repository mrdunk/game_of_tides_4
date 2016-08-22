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
badd +44 data_transport.h
badd +55 data_transport_ws.h
badd +1 logging.h
badd +1 terrain.h
badd +29 work.h
argglobal
silent! argdel *
argadd data_transport.cc
argadd work.h
argadd terrain.h
argadd logging.h
argadd data_transport_ws.h
argadd data_transport.h
argadd terrain.cc
argadd logging.cc
argadd hello_cpp_world.cc
argadd data_transport_ws.cc
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
let s:l = 44 - ((43 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
44
normal! 0
wincmd w
exe 'vert 1resize ' . ((&columns * 103 + 103) / 206)
exe 'vert 2resize ' . ((&columns * 102 + 103) / 206)
tabedit work.h
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winheight=1 winwidth=1
argglobal
let s:l = 29 - ((28 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
29
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
let s:l = 55 - ((29 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
55
normal! 0
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
let s:l = 80 - ((39 * winheight(0) + 28) / 57)
if s:l < 1 | let s:l = 1 | endif
exe s:l
normal! zt
80
normal! 0
tabnext 1
set stal=1
if exists('s:wipebuf')
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20 shortmess=filnxtToO
let s:sx = expand("<sfile>:p:r")."x.vim"
if file_readable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &so = s:so_save | let &siso = s:siso_save
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
