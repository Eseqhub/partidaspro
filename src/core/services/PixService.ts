/**
 * Gerador de PIX "copia e cola" (BR Code / EMV).
 * Implementação pura — segue a especificação do Banco Central.
 */

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) — exigido pelo padrão PIX
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Remove acentos e caracteres inválidos (nome/cidade só ASCII)
function sanitize(text: string, max: number): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .substring(0, max)
    .trim() || 'PELADA';
}

export interface PixParams {
  pixKey:       string;          // CPF, CNPJ, e-mail, telefone ou chave aleatória
  merchantName: string;          // nome do recebedor
  merchantCity?: string;         // cidade
  amount?:      number;          // valor (opcional)
  description?: string;          // descrição/identificador
  txid?:        string;          // identificador da transação
}

/**
 * Gera a string PIX copia-e-cola.
 */
export function generatePixCode({
  pixKey, merchantName, merchantCity = 'BRASIL', amount, description, txid = '***',
}: PixParams): string {
  // Merchant Account Information (GUI + chave + descrição)
  let mai = tlv('00', 'br.gov.bcb.pix') + tlv('01', pixKey);
  if (description) {
    const desc = sanitize(description, 40);
    if (desc) mai += tlv('02', desc);
  }

  const fields: string[] = [
    tlv('00', '01'),                       // Payload Format Indicator
    tlv('26', mai),                        // Merchant Account Information
    tlv('52', '0000'),                     // Merchant Category Code
    tlv('53', '986'),                      // Moeda — BRL
  ];

  if (amount && amount > 0) {
    fields.push(tlv('54', amount.toFixed(2))); // Valor
  }

  fields.push(tlv('58', 'BR'));                          // País
  fields.push(tlv('59', sanitize(merchantName, 25)));   // Nome do recebedor
  fields.push(tlv('60', sanitize(merchantCity, 15)));   // Cidade
  fields.push(tlv('62', tlv('05', sanitize(txid, 25) || '***'))); // TXID

  const partial = fields.join('') + '6304'; // CRC placeholder ID+len
  return partial + crc16(partial);
}

/** URL de QR Code (renderização externa opcional) — usar com cautela por privacidade */
export function pixQrImageUrl(code: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(code)}`;
}
