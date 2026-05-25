#!/usr/bin/env bash
# ============================================================
# ninesh jump — autojump-style directory navigation (bash)
# ============================================================

# Record every directory change in the background
_jump_prompt() {
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
    cd "$dir" && ls -alh
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

# Avoid duplicate PROMPT_COMMAND registration
if [[ -z "${_JUMP_HOOKED:-}" ]]; then
  PROMPT_COMMAND="_jump_prompt;${PROMPT_COMMAND}"
  export _JUMP_HOOKED=1
fi
