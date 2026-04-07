# bash compatible plugins
# git aliases
alias gps="git push"
alias gpl="git pull"
alias gt="git status -sb"
alias ga="git add ."
alias gc="git commit -av"
alias gcr="git checkout master && git fetch && git rebase"
alias gclean="git reset --hard && git clean -df"
alias grebase="git fetch && git rebase -i"
alias glg="git log --pretty='%C(red)%h%Creset%C(yellow)%d%Creset %s %C(cyan)(%ar)%Creset'"
alias gdel="git branch --merged master | egrep -v '(\*|master|release|bug$|dev)' | xargs -n 1 -r git branch -d"
alias gck="git checkout"

# cd aliases
alias ..='cd ../'
alias ...='cd ../../'
alias ....='cd ../../../'
alias ~="cd ~"
alias -- -="cd -"
alias ll="ls -alh"
alias la="ls -A"

# npm aliases
alias npmreg="npm config get registry"
alias npmm="npm config set registry https://registry.npmmirror.com/"
alias npmms="npm config set registry https://registry.npmjs.org/"

# proxy aliases
alias proxy='export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890'
alias unproxy='unset https_proxy http_proxy all_proxy'

# helper functions
mcd() {
  mkdir -p "$1" && cd "$1"
}

giget() {
    if [[ $# -ne 2 ]]; then
        echo "Usage: giget <github-repo> <destination-dir>"
        return 1
    fi

    local repo=$1
    local dir=$2

    mkdir -p "$dir"
    local repo_url="https://github.com/${repo#gh:}"
    local temp_dir=$(mktemp -d)
    git clone "$repo_url" "$temp_dir"

    if [[ $? -ne 0 ]]; then
        echo "Failed to clone repository from $repo_url"
        rm -rf "$temp_dir"
        return 1
    fi

    tar --exclude='.git' -czf /tmp/repo.tar.gz -C "$temp_dir" .
    tar -xzf /tmp/repo.tar.gz -C "$dir"
    rm -rf "$temp_dir"
    rm /tmp/repo.tar.gz

    echo "Repository cloned to $dir"
}
