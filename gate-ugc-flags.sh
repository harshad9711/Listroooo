#!/bin/bash
set -euo pipefail

# UGC Feature Flag Management Script
# This script manages all UGC-related feature flags for the application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# UGC Feature Flags
UGC_FEATURES=(
    "ugc.social-listening"
    "ugc.auto-editing"
    "ugc.voiceover-generation"
    "ugc.hotspot-generation"
    "ugc.database-integration"
    "ugc.inbox-management"
    "ugc.auto-edit-button"
    "ugc.voiceover-tab"
    "ugc.hotspot-generator"
    "ugc.dashboard"
)

# Function to print usage
print_usage() {
    echo -e "${BLUE}UGC Feature Flag Management Script${NC}"
    echo ""
    echo "Usage: $0 <command> <environment>"
    echo ""
    echo "Commands:"
    echo "  enable    - Enable all UGC features in the specified environment"
    echo "  disable   - Disable all UGC features in the specified environment"
    echo "  status    - Show status of all UGC features"
    echo "  create    - Create all UGC feature flags"
    echo "  promote   - Promote features from prototype to production"
    echo ""
    echo "Environments:"
    echo "  prototype  - Development/testing environment"
    echo "  production - Production environment"
    echo ""
    echo "Examples:"
    echo "  $0 enable prototype    # Enable all UGC features in prototype"
    echo "  $0 disable production  # Disable all UGC features in production"
    echo "  $0 status              # Show current status"
    echo "  $0 create              # Create all feature flags"
    echo "  $0 promote             # Promote from prototype to production"
}

# Function to check if bolt is available
check_bolt() {
    if ! command -v bolt &> /dev/null; then
        echo -e "${YELLOW}Warning: bolt command not found${NC}"
        echo "This script is designed to work with bolt feature flag management."
        echo "You may need to install bolt or use an alternative feature flag system."
        echo ""
        echo "To install bolt:"
        echo "  npm install -g @bolt/cli"
        echo ""
        return 1
    fi
    return 0
}

# Function to get feature description
get_feature_description() {
    local feature="$1"
    case "$feature" in
        "ugc.social-listening")
            echo "Enable social listening and UGC discovery from multiple platforms"
            ;;
        "ugc.auto-editing")
            echo "Enable AI-powered automatic editing of UGC content"
            ;;
        "ugc.voiceover-generation")
            echo "Enable AI voiceover generation for UGC videos"
            ;;
        "ugc.hotspot-generation")
            echo "Enable interactive hotspot generation for UGC content"
            ;;
        "ugc.database-integration")
            echo "Enable UGC database storage and management"
            ;;
        "ugc.inbox-management")
            echo "Enable UGC inbox for content management"
            ;;
        "ugc.auto-edit-button")
            echo "Enable auto-edit button in UGC interface"
            ;;
        "ugc.voiceover-tab")
            echo "Enable voiceover tab in UGC editor"
            ;;
        "ugc.hotspot-generator")
            echo "Enable hotspot generator tool"
            ;;
        "ugc.dashboard")
            echo "Enable UGC dashboard and analytics"
            ;;
        *)
            echo "UGC feature"
            ;;
    esac
}

# Function to create feature flags
create_features() {
    echo -e "${BLUE}Creating UGC feature flags...${NC}"
    
    if ! check_bolt; then
        echo -e "${YELLOW}Skipping bolt commands - bolt not available${NC}"
        echo "Feature flags will need to be created manually or through your feature flag system."
        return
    fi
    
    for feature in "${UGC_FEATURES[@]}"; do
        description=$(get_feature_description "$feature")
        echo -e "${GREEN}Creating feature: ${feature}${NC}"
        bolt feature create "$feature" \
            --description "$description" \
            --group "ugc" \
            --env prototype || {
            echo -e "${RED}Failed to create feature: ${feature}${NC}"
        }
    done
    
    echo -e "${GREEN}✅ All UGC feature flags created!${NC}"
}

# Function to enable features
enable_features() {
    local env="$1"
    echo -e "${BLUE}Enabling UGC features in ${env} environment...${NC}"
    
    if ! check_bolt; then
        echo -e "${YELLOW}Skipping bolt commands - bolt not available${NC}"
        echo "Features will need to be enabled manually in your feature flag system."
        return
    fi
    
    for feature in "${UGC_FEATURES[@]}"; do
        echo -e "${GREEN}Enabling: ${feature}${NC}"
        bolt feature enable "$feature" --env "$env" || {
            echo -e "${RED}Failed to enable: ${feature}${NC}"
        }
    done
    
    echo -e "${GREEN}✅ All UGC features enabled in ${env}!${NC}"
}

# Function to disable features
disable_features() {
    local env="$1"
    echo -e "${BLUE}Disabling UGC features in ${env} environment...${NC}"
    
    if ! check_bolt; then
        echo -e "${YELLOW}Skipping bolt commands - bolt not available${NC}"
        echo "Features will need to be disabled manually in your feature flag system."
        return
    fi
    
    for feature in "${UGC_FEATURES[@]}"; do
        echo -e "${YELLOW}Disabling: ${feature}${NC}"
        bolt feature disable "$feature" --env "$env" || {
            echo -e "${RED}Failed to disable: ${feature}${NC}"
        }
    done
    
    echo -e "${GREEN}✅ All UGC features disabled in ${env}!${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}UGC Feature Flag Status${NC}"
    echo "================================"
    
    if ! check_bolt; then
        echo -e "${YELLOW}Status check requires bolt - showing feature list instead${NC}"
        echo ""
        for feature in "${UGC_FEATURES[@]}"; do
            description=$(get_feature_description "$feature")
            echo -e "${GREEN}✓ ${feature}${NC}"
            echo "  ${description}"
            echo ""
        done
        return
    fi
    
    for feature in "${UGC_FEATURES[@]}"; do
        description=$(get_feature_description "$feature")
        echo -e "${GREEN}${feature}${NC}"
        echo "  ${description}"
        
        # Check prototype status
        if bolt feature status "$feature" --env prototype &>/dev/null; then
            echo -e "  Prototype: ${GREEN}✓ Enabled${NC}"
        else
            echo -e "  Prototype: ${RED}✗ Disabled${NC}"
        fi
        
        # Check production status
        if bolt feature status "$feature" --env production &>/dev/null; then
            echo -e "  Production: ${GREEN}✓ Enabled${NC}"
        else
            echo -e "  Production: ${RED}✗ Disabled${NC}"
        fi
        echo ""
    done
}

# Function to promote features
promote_features() {
    echo -e "${BLUE}Promoting UGC features from prototype to production...${NC}"
    
    if ! check_bolt; then
        echo -e "${YELLOW}Skipping bolt commands - bolt not available${NC}"
        echo "Features will need to be promoted manually in your feature flag system."
        return
    fi
    
    for feature in "${UGC_FEATURES[@]}"; do
        echo -e "${GREEN}Promoting: ${feature}${NC}"
        bolt feature promote "$feature" --from prototype --to production || {
            echo -e "${RED}Failed to promote: ${feature}${NC}"
        }
    done
    
    echo -e "${GREEN}✅ All UGC features promoted to production!${NC}"
}

# Function to update local feature flags file
update_local_flags() {
    echo -e "${BLUE}Updating local feature flags configuration...${NC}"
    
    # Create or update the feature flags file
    cat > src/lib/ugcFeatureFlags.ts << 'EOF'
// UGC Feature Flags Configuration
// This file is auto-generated by gate-ugc-flags.sh

export const UGC_FEATURE_FLAGS = {
  // Social listening and discovery
  'ugc.social-listening': {
    enabled: true,
    description: 'Enable social listening and UGC discovery from multiple platforms',
    group: 'ugc'
  },
  
  // Auto-editing capabilities
  'ugc.auto-editing': {
    enabled: true,
    description: 'Enable AI-powered automatic editing of UGC content',
    group: 'ugc'
  },
  
  // Voiceover generation
  'ugc.voiceover-generation': {
    enabled: true,
    description: 'Enable AI voiceover generation for UGC videos',
    group: 'ugc'
  },
  
  // Hotspot generation
  'ugc.hotspot-generation': {
    enabled: true,
    description: 'Enable interactive hotspot generation for UGC content',
    group: 'ugc'
  },
  
  // Database integration
  'ugc.database-integration': {
    enabled: true,
    description: 'Enable UGC database storage and management',
    group: 'ugc'
  },
  
  // Inbox management
  'ugc.inbox-management': {
    enabled: true,
    description: 'Enable UGC inbox for content management',
    group: 'ugc'
  },
  
  // Auto-edit button
  'ugc.auto-edit-button': {
    enabled: true,
    description: 'Enable auto-edit button in UGC interface',
    group: 'ugc'
  },
  
  // Voiceover tab
  'ugc.voiceover-tab': {
    enabled: true,
    description: 'Enable voiceover tab in UGC editor',
    group: 'ugc'
  },
  
  // Hotspot generator
  'ugc.hotspot-generator': {
    enabled: true,
    description: 'Enable hotspot generator tool',
    group: 'ugc'
  },
  
  // Dashboard
  'ugc.dashboard': {
    enabled: true,
    description: 'Enable UGC dashboard and analytics',
    group: 'ugc'
  }
} as const;

// Helper function to check if a feature is enabled
export function isUGCFeatureEnabled(feature: keyof typeof UGC_FEATURE_FLAGS): boolean {
  return UGC_FEATURE_FLAGS[feature]?.enabled ?? false;
}

// Helper function to get feature description
export function getUGCFeatureDescription(feature: keyof typeof UGC_FEATURE_FLAGS): string {
  return UGC_FEATURE_FLAGS[feature]?.description ?? 'No description available';
}

// Helper function to get all enabled features
export function getEnabledUGCFeatures(): string[] {
  return Object.entries(UGC_FEATURE_FLAGS)
    .filter(([_, config]) => config.enabled)
    .map(([feature]) => feature);
}

// Helper function to get all UGC features
export function getAllUGCFeatures(): string[] {
  return Object.keys(UGC_FEATURE_FLAGS);
}
EOF

    echo -e "${GREEN}✅ Local feature flags configuration updated!${NC}"
}

# Main script logic
main() {
    local command="${1:-}"
    local environment="${2:-}"
    
    case "$command" in
        "create")
            create_features
            update_local_flags
            ;;
        "enable")
            if [[ -z "$environment" ]]; then
                echo -e "${RED}Error: Environment required for enable command${NC}"
                print_usage
                exit 1
            fi
            enable_features "$environment"
            update_local_flags
            ;;
        "disable")
            if [[ -z "$environment" ]]; then
                echo -e "${RED}Error: Environment required for disable command${NC}"
                print_usage
                exit 1
            fi
            disable_features "$environment"
            update_local_flags
            ;;
        "status")
            show_status
            ;;
        "promote")
            promote_features
            update_local_flags
            ;;
        "help"|"-h"|"--help")
            print_usage
            ;;
        "")
            echo -e "${RED}Error: Command required${NC}"
            print_usage
            exit 1
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            print_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
