// netlify/functions/produtos.js
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function handler(event, context) {
  const dataFile = join(__dirname, '..', '..', 'produtos.json');
  let produtos = JSON.parse(readFileSync(dataFile, 'utf8'));

  if (event.httpMethod === 'GET') {
    return { statusCode: 200, body: JSON.stringify(produtos) };
  }
  if (event.httpMethod === 'POST') {
    const novo = JSON.parse(event.body);
    novo.id = produtos.length ? produtos.at(-1).id + 1 : 1;
    produtos.push(novo);
    writeFileSync(dataFile, JSON.stringify(produtos, null, 2));
    return { statusCode: 201, body: JSON.stringify(novo) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
}
