import fs from 'fs'
import path from 'path'
import unzipper from 'unzipper'
import csv from 'csv-parser'

/**
 * Recursively returns all files matching the given filter
 * @param {string} startPath Location of where to search files
 * @param {RegExp} filter 
 * @param {boolean | undefined} recursive Whether to check recursively in directory. Default true
 * @returns {string[]} Array of files that match filter
 */
const matchingFiles = (startPath = '.', filter = /\..*$/, recursive = true) => {
    if (!fs.existsSync(startPath)) {
        console.log("no dir ",startPath);
        return;
    }

    const files = fs.readdirSync(startPath);
    const wantedFiles = []

    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath,files[i]);
        const stat = fs.lstatSync(filename);
        if (recursive && stat.isDirectory()){
            wantedFiles.push(...fromDir(filename,filter));
        }
        // Filename matches extension
        else if (filter.test(filename)) {
            console.log('file found:', filename)
            wantedFiles.push(filename)
        }
    };

    return wantedFiles
};

const main = async () => {
    // List all zip files at directory
    const zips = matchingFiles('.', /\.zip$/)

    // Unzip all zip files into the `extracted` folder
    for await (const zip of zips) {
        // Extract zip file content
        fs.createReadStream(`./${zip}`).pipe(unzipper.Extract({ path: `./extracted/${zip}` }));
    }
            
    // List all csv files found in extracted
    const csvs = matchingFiles('./extracted',/\.csv$/)
     
    const data = []

    // Extract csv data into `data`
    await fs.createReadStream(csvs[0])
        .pipe(csv())
        .on('data', (row) => {
            data.push(row)
        })
        .on('end', () => {
            console.log(data)
        });

    console.log('finish')
}

main()