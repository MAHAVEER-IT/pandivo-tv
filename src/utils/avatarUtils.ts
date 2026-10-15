import { AvatarId } from '../database';

export function getCompanionArtwork(id: AvatarId | null): any {
  switch (id) {
    case 'bamboo':
      return require('../../assets/avatars/avatar_bamboo.webp');
    case 'ember':
      return require('../../assets/avatars/avatar_ember.webp');
    case 'frost':
      return require('../../assets/avatars/avatar_frost.webp');
    case 'sunny':
      return require('../../assets/avatars/avatar_sunny.webp');
    case 'shadow':
      return require('../../assets/avatars/avatar_shadow.webp');
    default:
      return require('../../assets/avatars/avatar_bamboo.webp');
  }
}
