using UnityEngine;
using UnityEngine.UI; // Si usas UI estándar
// using TMPro; // Si usas TextMeshPro (recomendado)

public class LoginScreenExample : MonoBehaviour
{
    public InputField UsernameInput; // O TMP_InputField
    public InputField PasswordInput; // O TMP_InputField
    public Button LoginButton;
    public Text StatusText;          // O TMP_Text

    private void Start()
    {
        LoginButton.onClick.AddListener(OnLoginClicked);
    }

    private void OnLoginClicked()
    {
        string u = UsernameInput.text;
        string p = PasswordInput.text;

        StatusText.text = "Conectando...";
        LoginButton.interactable = false;

        UnityNetworkManager.Instance.AttemptLogin(u, p, (success, message) =>
        {
            LoginButton.interactable = true;
            if (success)
            {
                StatusText.text = "Login OK! Obteniendo perfil...";
                
                // Una vez logueado, pedimos el perfil
                UnityNetworkManager.Instance.FetchUserProfile((profileSuccess, profile) =>
                {
                    if (profileSuccess)
                    {
                        StatusText.text = $"Hola, {profile.nombres} {profile.apellidos}!";
                        Debug.Log("Rol: " + profile.rol);
                        
                        // AQUÍ CARGARÍAS TU ESCENA DE JUEGO
                        // UnityEngine.SceneManagement.SceneManager.LoadScene("GameScene");
                    }
                    else
                    {
                        StatusText.text = "Login OK, pero falló perfil.";
                    }
                });
            }
            else
            {
                StatusText.text = "Error: " + message;
            }
        });
    }
}
