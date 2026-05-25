# ============================================================
# ninesh jump — autojump-style directory navigation
# ============================================================

# Record every directory change in the background
_jump_chpwd() {
  ninesh jump --add "$PWD" &>/dev/null &
}

# Jump to a frequently visited directory
j() {
  if [[ $# -eq 0 ]]; then
    ninesh jump --stat
    return
  fi

  local dir
  dir=$(ninesh jump "$@")
  if [[ -n "$dir" && -d "$dir" ]]; then
    cd "$dir" && ls -alhG
  elif [[ -n "$dir" ]]; then
    echo "$dir"
  fi
}

# Show top directories
jd() {
  ninesh jump --stat --top "${1:-10}"
}

# Purge dead entries
jp() {
  ninesh jump --purge
}

# Register the chpwd hook (interactive shells only)
if [[ -o interactive ]]; then
  autoload -U add-zsh-hook 2>/dev/null
  add-zsh-hook chpwd _jump_chpwd 2>/dev/null
fi
