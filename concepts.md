
- renderers are called with kv and ctx
  - kv.value.content is the _merged_ content, including prototypes
  - ctx.contentObs contains the _unmerged_ message content
    - editors manipulate the contentObs observable in realtime

  => it's a mistake to `contentObs.set(kv.value.content)`

- We can merge contentObs with its prototypes to get
  a realtime, merged value: previewObs

- contentObs() should be saved to localStorage periodically.
  Should be managed by EditorShell (or MultiEditor?)

  => we can preview stage content in editor shell
  => we see the published version outside editor shell

- PropertySheet compares previewObs to contentObs to find out what values are inherited
  (values existing in previewObs and are undefined in contentObs are inherited)
- PropertySheet compares previewObs to kv.value.content to find out about unpublished values
  (the values that differ are unpiblished)

Rules for renderers

- show kv.value.content

Optional Feature: live preview
- if there's ctx.previewObs, use it instead of kv.value.content (beware: it's a kv)

Optional Feature: editing
- if your renderer supports editing, show ctx.previewObs and manipulate ctx.contentObs


