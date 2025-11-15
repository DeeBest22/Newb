import * as _ from 'lodash';
import { omit, pick } from './functions';

export const buildSearchQuery = (options, searchableCols) => {
  const where = {};
  const searchArray: Array<{ [key: string]: any }> = [];
  if (!_.isEmpty(options)) {
    const keys = Object.keys(options);
    keys.forEach((key) => {
      const searchValue = options[key];
      if (key === 'accountId') {
        where['accountId'] = parseInt(options[key], 10);
      }

      if (key === 'status') {
        where['status'] = options[key];
      }

      if (key === 'search') {
        searchableCols.forEach((key) => {
          let data: any;

          // check if key does not contain id
          if (!key.toLowerCase().includes('id')) {
            data = {
              [key]: {
                contains: searchValue,
              },
            };
          }

          if (key.includes('.')) {
            const [relation, column, subColumn] = key.split('.');
            if (subColumn) {
              data = {
                [relation]: {
                  [column]: {
                    [subColumn]: {
                      contains: searchValue,
                    },
                  },
                },
              };
            } else {
              data = {
                [relation]: {
                  [column]: {
                    contains: searchValue,
                  },
                },
              };
            }
          }

          if (['company', 'operator', 'individual'].includes(key)) {
            data = {
              account: {
                [key]: {
                  name: {
                    contains: searchValue,
                  },
                },
              },
            };
          }

          searchArray.push(data);
        });
        if (searchArray.length) where['OR'] = searchArray;
      } else {
        if (searchableCols.includes(key)) {
          if (key.includes('Id')) {
            searchArray.push({
              [key]: parseInt(searchValue, 10),
            });
          } else if (key !== 'status') {
            searchArray.push({
              [key]: {
                contains: searchValue,
              },
            });
          }
          if (searchArray.length) where['AND'] = searchArray;
        }
      }
    });
  }
  return where;
};

export const buildQueryOptions = (option) => {
  const searchQuery = omit(option.query, ['limit', 'page', 'sort_by']);
  let options = {
    limit: option.limit,
    offset: option.skip,
    key: option.key,
    dir: option.dir,
  };
  options = _.merge(options, searchQuery);
  return options;
};

// recurvise function to build nested relations with an array of relations with dot notation
export const buildRelations = (relations) => {
  // TODO: refactor this to use recursive function
  if (relations.length) {
    const relationObj = {};
    relations.forEach((relation) => {
      if (relation.includes('.')) {
        const [parent, ...children] = relation.split('.');
        if (children.length > 1) {
          const [child, ...grandChildren] = children.join('.').split('.');
          if (grandChildren.length > 1) {
            const [grandChild, ...greatGrandChildren] = grandChildren
              .join('.')
              .split('.');
            relationObj[parent] = {
              include: {
                [child]: {
                  include: {
                    [grandChild]: {
                      include: {
                        [greatGrandChildren.join('.')]: true,
                      },
                    },
                  },
                },
              },
            };
          } else {
            relationObj[parent] = {
              include: {
                [child]: {
                  include: {
                    [grandChildren.join('.')]: true,
                  },
                },
              },
            };
          }
        } else {
          relationObj[parent] = {
            include: {
              [children]: true,
            },
          };
        }
      } else {
        relationObj[relation] = true;
      }
    });

    return relationObj;
  }
};

export const buildFillable = (data, fillable) =>
  fillable.length ? pick(data, fillable) : data;

export const buildCreateOrUpdate = (data: any, fillable: string[]) => {
  const fillableObj = buildFillable(data, fillable);

  return Object.keys(fillableObj).reduce((memo, key) => {
    if (key.includes('Id')) {
      const [relation] = key.split('Id');
      memo[relation] = {
        connect: {
          id: fillableObj[key],
        },
      };
    } else {
      memo[key] = fillableObj[key];
    }
    return memo;
  }, {});
};
