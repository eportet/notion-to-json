import fs from 'fs'
import path from 'path'
import unzipper from 'unzipper'
import csv from 'csv-parser'

const fromDir = (startPath = '.', filter = /.*/) => {
    if (!fs.existsSync(startPath)) {
        console.log("no dir ",startPath);
        return;
    }

    const files = fs.readdirSync(startPath);
    const wantedFiles = []

    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath,files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
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
    const zips = fromDir('.', /\.zip$/)

    for await (const zip of zips) {
        // Extract zip file content
        fs.createReadStream(`./${zip}`).pipe(unzipper.Extract({ path: `./extracted/${zip}` }));
    }
            
    const csvs = fromDir('./extracted',/\.csv$/)
     
    const data = []

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