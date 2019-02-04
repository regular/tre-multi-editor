const {client} = require('tre-client')
const Importer = require('tre-file-importer')
const h = require('mutant/html-element')
const {makePane, makeDivider, makeSplitPane} = require('tre-split-pane')
const setStyle = require('module-styles')('tre-images-demo')
const RenderStack = require('tre-render-stack')
const Finder = require('tre-finder')
const MultiEditor = require('.')
const computed = require('mutant/computed')
require('brace/theme/solarized_dark')

const Images = require('tre-images')
const Fonts = require('tre-fonts')
const Stylesheets = require('tre-stylesheets')
const Folders = require('tre-folders')

styles()

client( (err, ssb, config) => {
  if (err) return console.error(err)

  const importer = Importer(ssb, config)
          .use(Images)
          .use(Fonts)
          .use(Stylesheets)

  const prototypes = config.tre.prototypes

  const renderStack = TwoRenderStacks(ssb)
  const {render, renderTile} = renderStack

  const renderImage = Images(ssb, {
    prototypes
  })
  const renderFont = Fonts(ssb, {
    prototypes
  })
  const renderStylesheet = Stylesheets(ssb, {
    prototypes
  })
  const renderFolder = Folders(ssb, {
    prototypes,
    renderTile
  })

  renderStack
    .use(renderImage)
    .use(renderFont)
    .use(renderStylesheet)
    .use(renderFolder)

  const renderFinder = Finder(ssb, {
    importer,
    skipFirstLevel: true,
    details: (kv, ctx) => {
      return kv && kv.meta && kv.meta["prototype-chain"] ? h('i', '(has proto)') : []
    }
  })
  const renderMultiEditor = MultiEditor(ssb, {
    ace: {
      theme: 'ace/theme/solarized_dark',
    }
  })

  document.body.appendChild(h('.tre-multi-editor-demo', [
    makeSplitPane({horiz: true}, [
      makePane('25%', [
        renderFinder(config.tre.branches.root)
      ]),
      makeDivider(),
      makePane('70%', [
        computed(renderFinder.primarySelectionObs, kv => {
          if (!kv) return []
          return renderMultiEditor(kv, {
            render
          })
        })
      ])
    ])
  ]))
})

function TwoRenderStacks(ssb) {
  const tileRenderStack = RenderStack(ssb, {
    ctxOverrides: {
      previewObs: null,
      contentObs: null
    }
  })
  const renderStack = RenderStack(ssb)
  const renderTile = tileRenderStack.render
  const render = renderStack.render
  const self = {
    renderTile,
    render,
    use: r => {
      tileRenderStack.use(r)
      renderStack.use(r)
      return self
    }
  }
  return self
}

function styles() {
  setStyle(`
    body, html, .abundance, .abundance-ui, .abundance-stage, .tre-multi-editor {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      --tre-selection-color: green;
      --tre-secondary-selection-color: yellow;
      font-family: sans-serif;
    }
    h1 {
      font-size: 18px;
    }
    .pane {
      background: #eee;
    }
    .tre-finder .summary select {
      font-size: 9pt;
      background: transparent;
      border: none;
      width: 50px;
    }
    .tre-finder summary {
      white-space: nowrap;
    }
    .tre-finder summary:focus {
      outline: 1px solid rgba(255,255,255,0.1);
    }
    .tre-property-sheet {
      font-size: 9pt;
      background: #4a4a4b;
      color: #b6b6b6;
      height: 100%;
    }
    .tre-property-sheet summary {
      font-weight: bold;
      text-shadow: 0 0 4px black;
      margin-top: .3em;
      padding-top: .4em;
      background: #555454;
      border-top: 1px solid #807d7d;
      margin-bottom: .1em;
    }
    .tre-property-sheet input {
      background: #D0D052;
      border: none;
      margin-left: .5em;
    }
    .tre-property-sheet .inherited input {
      background: #656464;
    }
    .tre-property-sheet .new input {
      background: white;
    }
    .tre-property-sheet details > div {
      padding-left: 1em;
    }
    .tre-property-sheet [data-schema-type="number"] input {
      width: 4em;
    }
    .property[data-schema-type=string] {
      grid-column: span 3;
    }
    .tre-property-sheet .properties {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fill, 5em);
    }
    .tre-property-sheet details {
      grid-column: 1/-1;
    }
    .tre-folders {
      background-color: #777;
    }
    .tre-folders .tile {
      border: 1px solid #444;
      background: #666;
    }
    .tre-folders .tile > .name {
      font-size: 9pt;
      background: #444;
      color: #aaa;
    }
    .tile>.tre-image-thumbnail {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
    }
  `)
}
