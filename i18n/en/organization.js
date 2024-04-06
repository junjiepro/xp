const translations = {
  "organization": {
    "personal_account": "Personal Account",
    "organizations": "Organizations",
    "searching_organization": "Searching Organization...",
    "no_organization_found": "No organization found.",
    "create_organization": "Create Organization",
    "create_organization_description": "Add a new organization to manage products, customers and so on.",
    "name": "Organization name",
    "name_placeholder": "Your organization name",
    "subscription_plan": "Subscription plan",
    "your_roles": "Your roles in this organization",
    "danger_action": "Destructive Operations",
    "danger_action_description": "Please confirm that you want to do the following operations in this organization.",
    "change_owner": "Change owner",
    "type_to_confirm": "Type {{name}} to confirm",
    "formSchema": {
      "name": {
        "min": "The organization name must be at least 2 characters.",
        "max": "The organization name must not be greater than 50 characters."
      }
    },
    "create": {
      "success": "Organization created successfully."
    },
    "update": {
      "success": "Organization updated successfully."
    },
    "delete": {
      "name": "Delete organization",
      "description": "You cannot recover this organization once deleted.",
      "success": "Organization deleted successfully."
    }
  },
}

module.exports = translations;
