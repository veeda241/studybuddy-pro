/**
 * Downloads Xenova/flan-t5-small ONNX weights into public/models.
 * Model card: https://huggingface.co/Xenova/flan-t5-small
 *
 * Run: npm run download-model
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const MODEL = 'Xenova/flan-t5-small';
const OUT_ROOT = path.join(__dirname, '..', 'public', 'models', ...MODEL.split('/'));

const FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'special_tokens_map.json',
  'generation_config.json',
  'spiece.model',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx',
];

function fetchToFile(urlString, dest, redirectsLeft = 8) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const parsed = new URL(urlString);
    const lib = parsed.protocol === 'http:' ? http : https;
    const file = fs.createWriteStream(dest);

    const req = lib.get(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        protocol: parsed.protocol,
        headers: { 'User-Agent': 'studybuddy-pro-model-downloader' },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch (_) {}
          if (redirectsLeft <= 0) {
            return reject(new Error(`Too many redirects for ${urlString}`));
          }
          const next = new URL(res.headers.location, urlString).toString();
          return fetchToFile(next, dest, redirectsLeft - 1).then(resolve).catch(reject);
        }

        if (res.statusCode !== 200) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch (_) {}
          return reject(new Error(`HTTP ${res.statusCode} for ${urlString}`));
        }

        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      }
    );

    req.on('error', (err) => {
      file.close();
      try {
        fs.unlinkSync(dest);
      } catch (_) {}
      reject(err);
    });
  });
}

async function main() {
  console.log(`Downloading ${MODEL}`);
  console.log(`Source: https://huggingface.co/${MODEL}`);
  console.log(`Target: ${OUT_ROOT}\n`);

  for (const rel of FILES) {
    const url = `https://huggingface.co/${MODEL}/resolve/main/${rel}?download=true`;
    const dest = path.join(OUT_ROOT, rel);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`skip  ${rel}`);
      continue;
    }
    process.stdout.write(`get   ${rel} ... `);
    try {
      await fetchToFile(url, dest);
      const mb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
      console.log(`ok (${mb} MB)`);
    } catch (err) {
      console.log('failed');
      console.warn(`  ${err.message}`);
    }
  }

  console.log('\nDone.');
  console.log('App loads this via Transformers.js pipeline("text2text-generation", "Xenova/flan-t5-small").');
  console.log('If committing to GitHub, use Git LFS for *.onnx / large files.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
