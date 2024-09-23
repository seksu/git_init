import joi from 'joi';


export const isExists = (options) => async (value, helpers) => {
  const path = helpers.state.path.join('.');
  const { model, field = path } = options || {};
  const entity = await model.findOne({
    attributes: [field],
    where: { [field]: value },
    limit: 1,
  });
  if (entity) {
    return value;
  }

  return helpers.error('db.exists', { value });
};

export const customJoi = joi.extend((j) => ({
  type: 'db',
  base: j.any(),
  messages: {
    'db.exists': '{{#label}} is invalid',
  },
}));
