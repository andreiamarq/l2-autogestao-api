// Validador simples baseado em regras, sem dependências externas.
//
// regras = {
//   campo: {
//     tipo: 'string' | 'int' | 'number' | 'boolean' | 'enum',
//     obrigatorio: true,      // exigido na criação e no PUT
//     padrao: valor,          // usado na criação quando o campo é omitido
//     min, max,               // tamanho (string) ou valor (int/number)
//     valores: [...],         // para tipo 'enum'
//     transformar: (v) => v,  // normalização antes da validação (string/enum)
//     regex, mensagem,        // validação de formato
//   }
// }
//
// parcial = true (PATCH): só valida os campos enviados.
// Retorna { erros: [...], dados: {...} } com os valores já normalizados.

function validar(body, regras, parcial = false) {
  const erros = [];
  const dados = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { erros: ['O corpo da requisição deve ser um objeto JSON'], dados };
  }

  for (const [campo, r] of Object.entries(regras)) {
    let v = body[campo];

    if (v === undefined) {
      if (!parcial) {
        if (r.obrigatorio) erros.push(`O campo "${campo}" é obrigatório`);
        else if (r.padrao !== undefined) dados[campo] = r.padrao;
      }
      continue;
    }

    const vazio = v === null || (typeof v === 'string' && v.trim() === '');
    if (vazio) {
      if (r.obrigatorio) erros.push(`O campo "${campo}" não pode ser vazio`);
      else dados[campo] = r.padrao !== undefined ? r.padrao : null;
      continue;
    }

    switch (r.tipo) {
      case 'string':
      case 'enum': {
        if (typeof v !== 'string') {
          erros.push(`O campo "${campo}" deve ser um texto`);
          continue;
        }
        v = v.trim();
        if (r.transformar) v = r.transformar(v);
        if (r.tipo === 'enum') {
          if (!r.valores.includes(v)) {
            erros.push(`O campo "${campo}" deve ser um destes valores: ${r.valores.join(', ')}`);
            continue;
          }
        } else {
          if (r.min !== undefined && v.length < r.min) {
            erros.push(`O campo "${campo}" deve ter pelo menos ${r.min} caracteres`);
            continue;
          }
          if (r.max !== undefined && v.length > r.max) {
            erros.push(`O campo "${campo}" deve ter no máximo ${r.max} caracteres`);
            continue;
          }
          if (r.regex && !r.regex.test(v)) {
            erros.push(r.mensagem || `O campo "${campo}" tem formato inválido`);
            continue;
          }
        }
        break;
      }
      case 'int':
      case 'number': {
        if (typeof v !== 'number' || !Number.isFinite(v) || (r.tipo === 'int' && !Number.isInteger(v))) {
          erros.push(`O campo "${campo}" deve ser um número${r.tipo === 'int' ? ' inteiro' : ''}`);
          continue;
        }
        if (r.min !== undefined && v < r.min) {
          erros.push(`O campo "${campo}" deve ser maior ou igual a ${r.min}`);
          continue;
        }
        if (r.max !== undefined && v > r.max) {
          erros.push(`O campo "${campo}" deve ser menor ou igual a ${r.max}`);
          continue;
        }
        break;
      }
      case 'boolean': {
        if (typeof v !== 'boolean') {
          erros.push(`O campo "${campo}" deve ser true ou false`);
          continue;
        }
        break;
      }
      default:
        throw new Error(`Tipo de regra desconhecido: ${r.tipo}`);
    }

    dados[campo] = v;
  }

  if (parcial && erros.length === 0 && Object.keys(dados).length === 0) {
    erros.push('Informe ao menos um campo para atualizar');
  }

  return { erros, dados };
}

module.exports = { validar };
