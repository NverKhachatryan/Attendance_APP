export async function addClassToGroup(groupId: number, className: string) {
    try {
      const response = await fetch("/api/createClass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId, name: className }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add class to group");
      }
  
      return await response.json();
    } catch (error) {
      throw new Error("Failed to add class to group");
    }
  }
  