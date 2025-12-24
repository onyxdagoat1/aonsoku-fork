import { useTranslation } from 'react-i18next'
import {
  Content,
  ContentItem,
  ContentItemForm,
  ContentItemTitle,
  ContentSeparator,
  Header,
  HeaderDescription,
  HeaderTitle,
  Root,
} from '@/app/components/settings/section'
import { Switch } from '@/app/components/ui/switch'
import { useSongColor } from '@/store/player.store'

export function ColorSettings() {
  const { t } = useTranslation()
  const {
    useSongColorOnQueue,
    setUseSongColorOnQueue,
    useSongColorOnBigPlayer,
    setUseSongColorOnBigPlayer,
  } = useSongColor()

  return (
    <Root>
      <Header>
        <HeaderTitle>{t('settings.appearance.colors.group')}</HeaderTitle>
        <HeaderDescription>
          {t('settings.appearance.colors.description')}
        </HeaderDescription>
      </Header>
      <Content>
        {/* Queue and Big Player settings hidden - enabled by default */}
      </Content>
      <ContentSeparator />
    </Root>
  )
}
