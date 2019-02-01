const PropertySheet = require('tre-property-sheet')
const Shell = require('tre-editor-shell')
const WatchMerged = require('tre-prototypes')
//const WatchHeads = require('tre-watch-heads')
const {makePane, makeDivider, makeSplitPane} = require('tre-split-pane')
const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const setStyle = require('module-styles')('tre-multi-editor')

module.exports = function(ssb, config, opts) {
  opts = opts || {}
  styles()

  const watchMerged = WatchMerged(ssb)
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
    const {render} = ctx
    if (!content(kv)) return

    const whereObs = ctx.whereObs || Value(ctx.where || 'editor')
    const contentObs = Value(kv && unmergeKv(kv).value.content)
    const previewObs = getPreviewObs(contentObs)
  
    return h('.tre-multieditor', opts, [
      makeSplitPane({horiz: true}, [
        makePane('60%', [
          renderBar(whereObs),
          shellOrStage()
        ]),
        makeDivider(),
        makePane('40%', sheet())
      ])
    ])

    function stage() {
      //const kvObs = watchHeads(revisionRoot(kv))
      //const mergedKvObs = watchMerged(kvObs)
      return computed(whereObs, where => {
        if (where.includes('editor')) return []
        return render(kv, {where, previewObs})
      })
    }

    function shellOrStage() {
      return [
        h('.tre-multieditor-mode.preview', {
          classList: computed(whereObs, where => where.includes('editor') ? [] : ['active']),
        }, stage()),
        h('.tre-multieditor-mode.shell', {
          classList: computed(whereObs, where => where.includes('editor') ? ['active'] : []),
        }, shell())
      ]
    }

    function shell() {
      return renderShell(kv, {
        renderEditor: render,
        contentObs,
        previewObs,
        where: 'editor'
      })
    }

    function sheet() {
      return renderPropertySheet(kv, {
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

function renderBar(where) {
  return h('.bar', [
    h('select', {
      'ev-change': e => {
        where.set(e.target.value)
      }
    }, [
      h('option', 'editor'),
      h('option', 'stage'),
      h('option', 'thumbnail')
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
  `)
}
