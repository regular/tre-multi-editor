const PropertySheet = require('tre-property-sheet')
const Shell = require('tre-editor-shell')
const JsonEditor = require('tre-json-editor')
const WatchMerged = require('tre-prototypes')
//const WatchHeads = require('tre-watch-heads')
const {makePane, makeDivider, makeSplitPane} = require('tre-split-pane')
const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const setStyle = require('module-styles')('tre-multi-editor')

module.exports = function(ssb, opts) {
  opts = opts || {}
  styles()

  const watchMerged = WatchMerged(ssb)
  const renderJsonEditor = JsonEditor(ssb, Object.assign({
    ace: {
      tabSize: 2,
      useSoftTabs: true
    }
  }, opts))

  //const watchHeads = WatchHeads(ssb)
  const renderPropertySheet = PropertySheet()
  const renderShell = Shell(ssb, {
    save: (kv, cb) => {
      ssb.publish(kv.value.content, (err, msg) => {
        console.log('pyblish:', err, msg)
        cb(err, msg)
      })
    }
  })

  return function(kv, ctx) {
    ctx = ctx || {}
    const renderSpecialized = ctx.render
    if (!content(kv)) return

    const whereObs = ctx.whereObs || Value(ctx.where || 'editor')
    const contentObs = Value(kv && unmergeKv(kv).value.content)
    const previewObs = getPreviewObs(contentObs)
    const syntaxErrorObs = Value()
  
    return h('.tre-multieditor', [
      makeSplitPane({horiz: true}, [
        makePane('60%', [
          renderBar(whereObs),
          shellOrStage()
        ]),
        makeDivider(),
        makePane('40%', sheet())
      ])
    ])

    function raw() {
      const includeProtos = Value(false)
      const showPreview = Value(false)
      const kvObs = computed(showPreview, preview => {
        return preview ? previewObs : watchMerged(revisionRoot(kv))
      })
      return h('div', [
        h('input', {
          type: 'checkbox',
          'ev-change': e=>{
            includeProtos.set(e.target.checked)
          }
        }), h('span', 'include prototypes'), 
        h('input', {
          type: 'checkbox',
          'ev-change': e=>{
            showPreview.set(e.target.checked)
          }
        }), h('span', 'show draft'), 
        computed([whereObs, kvObs, includeProtos, showPreview], (where, kv, protos, preview) => {
          if (where !== 'raw') return []
          const showKv = protos ? kv : unmergeKv(kv)
          return h('pre', JSON.stringify(showKv, null, 2))
        })
      ])
    }

    function stage() {
      return computed(whereObs, where => {
        if (where.includes('editor')) return []
        return renderSpecialized(kv, {where, previewObs})
      })
    }

    function shellOrStage() {
      return [
        h('.tre-multieditor-mode.raw', {
          classList: computed(whereObs, where => where == 'raw' ? ['active'] : []),
        }, raw()),
        h('.tre-multieditor-mode.preview', {
          classList: computed(whereObs, where => (where.includes('editor') || where == 'raw') ? [] : ['active']),
        }, stage()),
        h('.tre-multieditor-mode.shell', {
          classList: computed(whereObs, where => where.includes('editor') ? ['active'] : []),
        }, shell())
      ]
    }

    function renderSpecializedAndJsonEditors(kv, ctx) {
      return [
        h('.tre-multieditor-mode.specialized', {
          classList: computed(whereObs, where => where == 'json-editor' ? [] : ['active'])
        }, [
          renderSpecialized(kv, ctx)
        ]),
        h('.tre-multieditor-mode.json', {
          classList: computed(whereObs, where => where == 'json-editor' ? ['active'] : []),
        }, [
          renderJsonEditor(kv, ctx)
        ])
      ]
    }

    function shell() {
      return renderShell(kv, {
        renderEditor: renderSpecializedAndJsonEditors,
        contentObs,
        previewObs,
        syntaxErrorObs,
        where: 'editor'
      })
    }

    function sheet() {
      return renderPropertySheet(kv, {
        disabled: computed(syntaxErrorObs, e => !!e),
        contentObs,
        previewObs
      })
    }
  }

  function getPreviewObs(contentObs) {
    const editing_kv = computed(contentObs, content => {
      if (!content) return null
      return {
        key: 'draft',
        value: {
          content
        }
      }
    })
    return watchMerged(editing_kv)
  }
}

function renderBar(whereObs) {
  function tab(title, where) {
    return h('div.tre-multieditor-tab', {
      classList: computed(whereObs, w => w == where ? ['active'] : []),
      attributes: {
        'data-where': where
      }
    }, title)
  }
  return h('.tre-multieditor-bar', [
    h('tre-multieditor-bar', {
      'ev-click': e => {
        whereObs.set(e.target.getAttribute('data-where'))
      }
    }, [
      tab('Preview', 'stage'),
      tab('Edit', 'editor'),
      tab('JSON', 'json-editor'),
      tab('Raw', 'raw'),
      tab('Thumbnail', 'thumbnail')
    ])
  ])
}


function content(kv) {
  return kv && kv.value && kv.value.content
}

function unmergeKv(kv) {
  // if the message has prototypes and they were merged into this message value,
  // return the unmerged/original value
  return kv && kv.meta && kv.meta['prototype-chain'] && kv.meta['prototype-chain'][0] || kv
}

function revisionRoot(kv) {
  return kv && kv.value.content && kv.value.content.revisionRoot || kv && kv.key
}

function styles() {
  setStyle(`
    .tre-multieditor {
      margin: 0;
      padding: 0;
    }
    .tre-multieditor-mode {
      display: none;
    }
    .tre-multieditor-mode.active {
      display: block;
    }
    .tre-multieditor-bar {
      background: #333;
    }
    .tre-multieditor-tab {
      display: inline-block;
      background: #444;
      padding: 2px 1em;
      margin: 2px 1px 0 1px;
      border-radius: 4px 4px 0 0;
    }
    .tre-multieditor-tab.active {
      background: #777;
    }
  `)
}
