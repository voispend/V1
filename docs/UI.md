# UI Components Documentation

## AppHeader

A unified header component for all screens of the app with consistent design and optional motion effects.

### Design Features

- **Background**: Pastel green (#A8D5BA) with matte look
- **Height**: Fixed 72px across all screens
- **Typography**: Centered title (22px, medium-bold) with optional subtitle
- **Status Bar**: Seamless color extension into status bar
- **Motion**: Scroll-based title scaling and background opacity changes
- **Icons**: Optional left/right icons with consistent styling

### Props

```typescript
interface AppHeaderProps {
  title: string;                    // Required: Main header text
  subtitle?: string;                // Optional: Contextual hint below title
  leftIcon?: React.ReactNode;       // Optional: Left side icon/button
  rightIcon?: React.ReactNode;      // Optional: Right side icon/button
  onLeftPress?: () => void;         // Optional: Left icon press handler
  onRightPress?: () => void;        // Optional: Right icon press handler
}
```

### Usage Examples

#### Basic Header (Title Only)
```tsx
<AppHeader title="Screen Title" />
```

#### Header with Subtitle
```tsx
<AppHeader 
  title="Reports" 
  subtitle="Track your spending patterns" 
/>
```

#### Header with Right Icon
```tsx
<AppHeader 
  title="Home" 
  subtitle="Voice your expenses with Voispend"
  rightIcon={
    <Ionicons name="help-circle-outline" size={20} color="#4A5568" />
  }
  onRightPress={() => navigateTo('/help')}
/>
```

#### Header with Left Icon (Back Button)
```tsx
<AppHeader 
  title="Expense Details"
  leftIcon={
    <Ionicons name="arrow-back" size={20} color="#4A5568" />
  }
  onLeftPress={() => goBack()}
/>
```

#### Header with Both Icons
```tsx
<AppHeader 
  title="Settings"
  leftIcon={
    <Ionicons name="menu" size={20} color="#4A5568" />
  }
  rightIcon={
    <Ionicons name="help-circle" size={20} color="#4A5568" />
  }
  onLeftPress={() => openMenu()}
  onRightPress={() => openHelp()}
/>
```



### Screen Implementations

#### Home Screen
```tsx
<AppHeader 
  title="Home" 
  subtitle="Voice your expenses with Voispend"
  rightIcon={
    <Ionicons name="help-circle-outline" size={20} color="#4A5568" />
  }
  onRightPress={() => navigateTo('/reports')}
/>
```

#### Record Screen
```tsx
<AppHeader title="Record" />
```

#### Reports Screen
```tsx
<AppHeader 
  title="Reports" 
  subtitle="Track your spending patterns" 
/>
```

#### Expenses Screen
```tsx
<AppHeader title="Expenses" />
```

#### Settings Screen
```tsx
<AppHeader title="Settings" />
```

### Styling

The component uses consistent design tokens:
- **Colors**: Pastel green background with dark text for contrast
- **Spacing**: 8pt grid system for consistent margins and padding
- **Shadows**: Subtle shadow with bottom border for separation
- **Touch Targets**: 44x44px minimum for accessibility

### Motion Effects

*Note: Scroll-based motion effects have been temporarily removed for stability. The component provides a clean, static header design.*

### Accessibility

- Proper `accessibilityRole` for interactive elements
- Consistent touch target sizes (44x44px minimum)
- High contrast text colors for readability
- Semantic button labeling
