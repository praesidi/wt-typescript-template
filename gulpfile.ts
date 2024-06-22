import { dest, src, task, watch, series, parallel } from 'gulp'
import { createProject } from 'gulp-typescript'
import del from 'del'
const stripImportExport = require('gulp-strip-import-export')
import change from 'gulp-change'
import header from 'gulp-header'
import {
    SRC_PATH,
    IMPORT_REGEXP,
    TS_CONFIG_PATH,
    WATCHED_TS_TYPES,
    BUILD_PATH,
    EXPORT_REGEXP,
} from './gulp/consts'
const eslint = require('gulp-eslint')

const include = require('gulp-include')

import babel from 'gulp-babel'

const removeImportsExports = (content: string) =>
    content.replace(IMPORT_REGEXP, '// $1').replace(EXPORT_REGEXP, '// $1')
const replaceMultilinesForm = (content: string) =>
    content.replace(/\\n/g, '\\\n').replace(/\\t/g, '\t')

const transformTS = (path: string) => {
    return src(path, { base: SRC_PATH })
        .pipe(
            include({
                extensions: 'ts',
            })
        )
        .pipe(change(removeImportsExports))
        .pipe(createProject(TS_CONFIG_PATH)())
        .pipe(change(replaceMultilinesForm))
        .pipe(stripImportExport())
        .pipe(
            babel({
                presets: ['@babel/preset-env'],
            })
        )
        .on('error', (error) => console.log(`🛑 Transpilation error: ${error}`))
        .on('end', () => {
            console.log(`☑️   ESLint check completed for "${path}"`)
            console.log(`-------------------------------------------------------------\n`)
            console.log(
                `✅ File "${path}" transpiled successfully [${new Date().toLocaleTimeString()}] 🕙`
            )
        })
}

task('dev', (done) => {
    console.log(`\n-------------------------------------------------------------`)
    WATCHED_TS_TYPES.forEach((x) => {
        watch(x).on('change', (path: string) => {
            console.log(`\n🚀 Build start...`)
            src(path, { base: SRC_PATH })
                .pipe(eslint())
                .on('end', () => {
                    console.log(`\n-------------------------------------------------------------`)
                })
                .pipe(eslint.format())
            transformTS(path)
                .pipe(change((content) => `<%\n${content}\n%>\n`))
                .pipe(header('\ufeff'))
                .pipe(dest(BUILD_PATH))
                .on('end', () => {
                    console.log(`\n🚀 Build end.`)
                })
        })

        console.log(`☑️   Watcher on "${x}" have started [change event]`)
    })
    console.log(`-------------------------------------------------------------\n`)
    done()
})

task('build', async (done) => {
    await del('build')

    WATCHED_TS_TYPES.forEach((x) =>
        transformTS(x)
            .pipe(change((content) => `<%\n${content}\n%>\n`))
            .pipe(header('\ufeff'))
            .pipe(dest(BUILD_PATH))
    )

    done()
})
