# Alias
alias ,ip="ipconfig getifaddr en0"
alias ,sshconfig="vim ~/.ssh/config"
alias ,gitconfig="vim ~/.gitconfig"

# Chore
alias br="bun run"
alias c='code .'
alias y='yarn'
alias p='pnpm'
alias pi="echo 'Pinging Baidu' && ping www.baidu.com"
alias ip="ipconfig getifaddr en0 && ipconfig getifaddr en1"
alias cip="curl cip.cc"
alias hosts="vi /etc/hosts"
alias cdtemp="cd `mktemp -d /tmp/ajiu9-XXXXXX`"

# Proxy
alias proxy='export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890'
alias unproxy='unset https_proxy http_proxy all_proxy'

# System
alias showFiles="defaults write com.apple.finder AppleShowAllFiles YES && killall Finder"
alias hideFiles="defaults write com.apple.finder AppleShowAllFiles NO && killall Finder"

# cd
alias ..='cd ../'
alias ...='cd ../../'
alias ..l.='cd ../../ && ll'
alias ....='cd ../../../'
alias ~="cd ~"
alias -- -="cd -"
alias ll="ls -alhG"
alias ls="ls -G"

# npm
alias npmmg="npm config set registry https://registry.npmmirror.com/ --global"
alias npmmsg="npm config set registry https://registry.npmjs.org/ --global"
alias npmm="npm config set registry https://registry.npmmirror.com/"
alias npmms="npm config set registry https://registry.npmjs.org/"

function movie() {
  NOW=$(date +"%y%m%d%H%M%S");
  cd ~/screencapture/jpg;
  dir=~/"screencapture/mov"
  mkdir -p "$dir"

  cnt=0
  rm -rf .DS_Store;
  for file in *
    do
      if [ -f "$file" ] ; then
      ext=${file##*.}
      printf -v pad "%05d" "$cnt"
      mv "$file" "${pad}.${ext}"
      cnt=$(( $cnt + 1 ))
    fi
  done;
  rm -rf 00000.jpg;
  for pic in *.jpg;
    do convert $pic -resize 100% $pic;
  done;

  local pixel=${1:-5}
  echo $pixel
  # ffmpeg -r 24 -i %05d.jpg -b:v 20000k ~/screencapture/mov/$USER-$NOW.mov;
  # ffmpeg -r $pixel -i %05d.jpg -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p ~/screencapture/mov/$USER-$NOW.mp4;
  ffmpeg -framerate $pixel -i %05d.jpg -vf "scale=800:-1,setsar=1:1" -loop 0 -gifflags +transdiff ~/screencapture/mov/$USER-$NOW.gif;
  # rm -rf ./*.jpg;
}
function mcd {
  mkdir $1 && cd $1;
}
function pfd() {
  osascript 2>/dev/null <<EOF
    tell application "Finder"
      return POSIX path of (target of window 1 as alias)
    end tell
EOF
}
function cdf() {
  cd "$(pfd)"
}
function ,touch {
  mkdir -p "$(dirname "$1")" && touch "$1"
}
function ,take() {
  mkdir -p "$(dirname "$1")" && touch "$1" && cd "$(dirname "$1")"
}
