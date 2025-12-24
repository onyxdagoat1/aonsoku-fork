export enum Theme {
  Black = 'black',
  OneDark = 'one-dark',
  NightOwlLight = 'night-owl-light',
  MarmaladeBeaver = 'marmalade-beaver',
  NoctisLilac = 'noctis-lilac',
  GithubDark = 'github-dark',
  ShadesOfPurple = 'shades-of-purple',
  BeardedSolarized = 'bearded-solarized',
  CatppuccinMocha = 'catppuccin-mocha',
  NuclearDark = 'nuclear-dark',
  Achiever = 'achiever',
  Dracula = 'dracula',
  Discord = 'discord',
  TinaciousDesign = 'tinacious-design',
}

export interface IThemeContext {
  theme: Theme
  setTheme: (theme: Theme) => void
}
