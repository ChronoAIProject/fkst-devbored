map(
  select(.reason == "compiler-message" and .message.code != null)
  | {
      code: .message.code.code,
      file: (
        ([.message.spans[]? | select(.is_primary == true) | .file_name][0])
        // "<no-primary>"
      ),
      message: .message.message
    }
)
| sort_by(.code, .file, .message)
| group_by(.code, .file, .message)
| map({
    code: .[0].code,
    file: .[0].file,
    message: .[0].message,
    multiplicity: length
  })
