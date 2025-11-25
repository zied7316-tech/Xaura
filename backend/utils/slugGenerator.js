/**
 * Generate URL-friendly slug from salon name
 * Example: "Sidi Bou Coiff" -> "sidi_bou_coiff"
 */
const generateSlug = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove special characters except underscores
    .replace(/[^a-z0-9_]/g, '')
    // Remove multiple consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '');
};

/**
 * Generate unique slug by appending number if duplicate exists
 */
const generateUniqueSlug = async (name, Salon, excludeId = null) => {
  let baseSlug = generateSlug(name);
  
  if (!baseSlug) {
    // Fallback if name is empty or invalid
    baseSlug = 'salon';
  }
  
  let slug = baseSlug;
  let counter = 1;
  let exists = true;
  
  while (exists) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingSalon = await Salon.findOne(query);
    exists = !!existingSalon;
    
    if (exists) {
      slug = `${baseSlug}_${counter}`;
      counter++;
    }
  }
  
  return slug;
};

module.exports = {
  generateSlug,
  generateUniqueSlug
};

