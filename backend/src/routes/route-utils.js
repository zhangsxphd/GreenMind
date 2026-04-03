export function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function handleRepositoryError(reply, error) {
  if (error.message.includes('not found')) {
    reply.code(404).send({ message: error.message });
    return true;
  }

  if (error.message.includes('UNIQUE constraint failed')) {
    reply.code(409).send({ message: '记录已存在，请检查名称或编码是否重复' });
    return true;
  }

  return false;
}
