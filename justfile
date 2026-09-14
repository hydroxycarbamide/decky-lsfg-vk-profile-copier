update-plugin:
    bash ./.vscode/build.sh
    sudo rm -rf "./out/LSFG-VK-Profile-Copier"
    sudo rm -rf "{{env_var('HOME')}}/homebrew/plugins/LSFG-VK-Profile-Copier"
    sudo unzip "./out/LSFG-VK-Profile-Copier.zip" -d "{{env_var('HOME')}}/homebrew/plugins/"
