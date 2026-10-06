// Restore only this signed-in player's nickname; never overwrite a name being edited.
export function createNicknameRestorer(field, client) {
  let identity, request = 0;
  return async user => {
    const uid = user?.uid || null;
    if (identity !== uid) { identity = uid; field.value = ""; }
    const generation = ++request, original = field.value;
    if (!uid) return;
    try {
      const profile = await client.call("player.profile");
      if (generation === request && client.user?.uid === uid && field.value === original && !original)
        field.value = profile.displayName || "";
    } catch { /* The field remains editable if the saved name is unavailable. */ }
  };
}
